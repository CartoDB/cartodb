# coding: UTF-8
require_relative './user/user_decorator'
require_relative './user/oauths'
require_relative '../models/synchronization/synchronization_oauth'
require_relative './visualization/member'
require_relative './visualization/collection'
require_relative './user/user_organization'

class User < Sequel::Model
  include CartoDB::MiniSequel
  include CartoDB::UserDecorator
  include Concerns::CartodbCentralSynchronizable

  self.strict_param_setting = false

  # @param name             String
  # @param avatar_url       String
  # @param database_schema  String

  one_to_one :client_application
  one_to_many :synchronization_oauths
  one_to_many :tokens, :class => :OauthToken
  one_to_many :maps
  one_to_many :assets
  one_to_many :data_imports
  one_to_many :geocodings, order: :created_at.desc
  many_to_one :organization

  many_to_many :layers, :order => :order, :after_add => proc { |user, layer|
    layer.set_default_order(user)
  }

  # Sequel setup & plugins
  plugin :association_dependencies, :client_application => :destroy, :synchronization_oauths => :destroy
  plugin :validation_helpers
  plugin :json_serializer
  plugin :dirty


  # Restrict to_json attributes
  @json_serializer_opts = {
    :except => [ :crypted_password,
                 :salt,
                 :invite_token,
                 :invite_token_date,
                 :admin,
                 :enabled,
                 :map_enabled],
    :naked => true # avoid adding json_class to result
  }

  SYSTEM_TABLE_NAMES = %w( spatial_ref_sys geography_columns geometry_columns raster_columns raster_overviews cdb_tablemetadata )
  GEOCODING_BLOCK_SIZE = 1000

  self.raise_on_typecast_failure = false
  self.raise_on_save_failure = false

  ## Validations
  def validate
    super
    validates_presence :username
    validates_unique   :username
    validates_format /^[a-z0-9\-\.]+$/, :username, :message => "must only contain lowercase letters, numbers, dots & hyphens"
    errors.add(:name, 'is taken') if name_exists_in_organizations?

    validates_presence :email
    validates_unique   :email, :message => 'is already taken'
    validates_format EmailAddressValidator::Regexp::ADDR_SPEC, :email, :message => 'is not a valid address'

    validates_presence :password if new? && (crypted_password.blank? || salt.blank?)
    if new? || password.present?
      errors.add(:password, "is not confirmed") unless password == password_confirmation
    end

    if organization.present?
      errors.add(:organization, "not enough seats") if new? && organization.users.count >= organization.seats
      errors.add(:quota_in_bytes, "not enough disk quota") if quota_in_bytes.to_i + organization.assigned_quota > organization.quota_in_bytes
    end
  end

  ## Callbacks
  def before_create
    super
    self.database_host ||= ::Rails::Sequel.configuration.environment_for(Rails.env)['host']
    self.api_key ||= self.class.make_token
  end

  def before_save
    super
    self.updated_at = Time.now

    # Set account_type and default values for organization users
    # TODO: Abstract this
    self.account_type = "ORGANIZATION USER" if self.organization_user? && !self.organization_owner?
    if self.organization_user?
      self.max_layers ||= 6
      self.private_tables_enabled ||= true
      self.sync_tables_enabled ||= true
    end
  end #before_save

  def after_create
    super
    setup_user
    save_metadata
    self.load_avatar
    monitor_user_notification
    sleep 3
    set_statement_timeouts
  end

  def after_save
    super
    save_metadata
    changes = (self.previous_changes.present? ? self.previous_changes.keys : [])
    set_statement_timeouts   if changes.include?(:user_timeout) || changes.include?(:database_timeout)
    rebuild_quota_trigger    if changes.include?(:quota_in_bytes)
    if changes.include?(:account_type) || changes.include?(:disqus_shortname) || changes.include?(:email) || \
       changes.include?(:website) || changes.include?(:name) || changes.include?(:description) || \
       changes.include?(:twitter_username)
      invalidate_varnish_cache(regex: '.*:vizjson')
    end
    if changes.include?(:database_host)
      User.terminate_database_connections(database_name, previous_changes[:database_host][0])
    elsif changes.include?(:database_schema)
      User.terminate_database_connections(database_name, database_host)
    end

  end

  def before_destroy
    error_happened = false
    has_organization = false

    unless self.organization_id.nil?
      if self.organization.owner.id == self.id && self.organization.users.count > 1
        msg = 'Attempted to delete owner from organization with other users'
        CartoDB::Logger.info msg
        raise CartoDB::BaseCartoDBError.new(msg)
      end

      # Right now, cannot delete users with entities shared with other users or the org.
      can_delete = true
      CartoDB::Permission.where(owner_id: self.id).each { |permission|
        can_delete = can_delete && permission.acl.empty?
      }
      unless can_delete
        raise CartoDB::BaseCartoDBError.new('Cannot delete user, has shared entities')
      end

      has_organization = true
    end

    begin
      self.organization_id = nil

      # Remove user tables
      self.tables.all.each { |t| t.destroy }

      # Remove user data imports, maps, layers and assets
      self.data_imports.each { |d| d.destroy }
      self.maps.each { |m| m.destroy }
      self.layers.each { |l| self.remove_layer l }
      self.geocodings.each { |g| g.destroy }
      self.assets.each { |a| a.destroy }
    rescue StandardError => exception
      error_happened = true
      CartoDB::Logger.info "Error destroying user #{username}. #{exception.message}\n#{exception.backtrace}"
    end

    # Remove metadata from redis
    $users_metadata.DEL(self.key) unless error_happened

    # Invalidate user cache
    self.invalidate_varnish_cache

    # Delete the DB or the schema
    if has_organization
      self.drop_organization_user unless error_happened
    else
      if User.where(:database_name => self.database_name).count > 1
        raise CartoDB::BaseCartoDBError.new('The user is not supposed to be in a organization but another user has the same database_name. Not dropping it')
      else
        self.drop_database_and_user unless error_happened
      end
    end
  end

  # Org users share the same db, so must only delete the schema
  def drop_organization_user
    Thread.new do
      in_database(as: :superuser) do |database|
        # Drop this user privileges in every schema of the DB
        schemas = ['cdb', 'cdb_importer', 'cartodb', 'public'] + 
          User.select(:database_schema).where(:organization_id => self.organization_id).all.collect(&:database_schema).uniq
        schemas.each do |s|
          drop_user_privileges_in_schema(s)
        end
        # Drop user quota function
        database.run(%Q{ DROP FUNCTION IF EXISTS \"#{self.database_schema}\"._cdb_userquotainbytes()})
        # If user is in an organization should never have public schema, so to be safe check
        database.run(%Q{ DROP SCHEMA IF EXISTS "#{self.database_schema}" }) unless self.database_schema == 'public'
      end

      connection_params = ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
          'host' => database_host,
          'database' => 'postgres'
      ) {|key, o, n| n.nil? ? o : n}
      conn = ::Sequel.connect(connection_params)
      User.terminate_database_connections(database_name, database_host)
      conn.run("REVOKE ALL ON DATABASE \"#{database_name}\" FROM \"#{database_username}\"")
      conn.run("REVOKE ALL ON DATABASE \"#{database_name}\" FROM \"#{database_public_username}\"")
      conn.run("DROP USER \"#{database_public_username}\"")
      conn.run("DROP USER \"#{database_username}\"")
      conn.disconnect
    end.join
    monitor_user_notification
  end

  def drop_database_and_user
    Thread.new do
      connection_params = ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        'host' => database_host,
        'database' => 'postgres'
      ) {|key, o, n| n.nil? ? o : n}
      conn = ::Sequel.connect(connection_params.merge(:after_connect=>(proc do |conn|
        conn.execute(%Q{ SET search_path TO "#{self.database_schema}", cartodb, public })
      end)))
      conn.run("UPDATE pg_database SET datallowconn = 'false' WHERE datname = '#{database_name}'")
      User.terminate_database_connections(database_name, database_host)
      conn.run("DROP DATABASE \"#{database_name}\"")
      conn.run("DROP USER \"#{database_username}\"")
      conn.disconnect
    end.join
    monitor_user_notification
  end

  def self.terminate_database_connections(database_name, database_host)
      connection_params = ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        'host' => database_host,
        'database' => 'postgres'
      ) {|key, o, n| n.nil? ? o : n}
      conn = ::Sequel.connect(connection_params)
      conn.run("
        DO language plpgsql $$
        DECLARE
            ver INT[];
            sql TEXT;
        BEGIN
            SELECT INTO ver regexp_split_to_array(
              regexp_replace(version(), '^PostgreSQL ([^ ]*) .*', '\\1'),
              '\\.'
            );
            sql := 'SELECT pg_terminate_backend(';
            IF ver[1] > 9 OR ( ver[1] = 9 AND ver[2] > 1 ) THEN
              sql := sql || 'pid';
            ELSE
              sql := sql || 'procpid';
            END IF;

            sql := sql || ') FROM pg_stat_activity WHERE datname = '
              || quote_literal('#{database_name}');

            RAISE NOTICE '%', sql;

            EXECUTE sql;
        END
        $$
      ")
      conn.disconnect
  end

  def invalidate_varnish_cache(options = {})
    options[:regex] ||= '.*'
    CartoDB::Varnish.new.purge("#{database_name}#{options[:regex]}")
  end

  ## Authentication
  AUTH_DIGEST = '47f940ec20a0993b5e9e4310461cc8a6a7fb84e3'

  # allow extra vars for auth
  attr_reader :password
  attr_accessor :password_confirmation

  ##
  # SLOW! Checks map views for every user
  # delta: get users who are also this percentage below their limit.
  #        example: 0.20 will get all users at 80% of their map view limit
  #
  def self.overquota(delta = 0)
    User.where(enabled: true).all.reject{ |u| u.organization_id.present? }.select do |u|
        limit = u.map_view_quota.to_i - (u.map_view_quota.to_i * delta)
        over_map_views = u.get_api_calls(from: u.last_billing_cycle, to: Date.today).sum > limit
        limit = u.geocoding_quota.to_i - (u.geocoding_quota.to_i * delta)
        over_geocodings = u.get_geocoding_calls > limit
        over_map_views || over_geocodings
    end
  end

  def self.password_digest(password, salt)
    digest = AUTH_DIGEST
    10.times do
      digest = secure_digest(digest, salt, password, AUTH_DIGEST)
    end
    digest
  end

  def self.secure_digest(*args)
    Digest::SHA1.hexdigest(args.flatten.join('--'))
  end

  def self.make_token
    secure_digest(Time.now, (1..10).map{ rand.to_s })
  end

  def password=(value)
    @password = value
    self.salt = new?? self.class.make_token : User.filter(:id => self.id).select(:salt).first.salt
    self.crypted_password = self.class.password_digest(value, salt)
  end

  def self.authenticate(email, password)
    if candidate = User.filter("email ILIKE ? OR username ILIKE ?", email, email).first
      candidate.crypted_password == password_digest(password, candidate.salt) ? candidate : nil
    else
      nil
    end
  end

  # Database configuration setup

  def database_username
    if Rails.env.production?
      "cartodb_user_#{id}"
    elsif Rails.env.staging?
      "cartodb_staging_user_#{self.id}"
    else
      "#{Rails.env}_cartodb_user_#{id}"
    end
  end

  def database_public_username
    has_organization_enabled? ? "cartodb_publicuser_#{id}" : 'publicuser'
  end

  def database_password
    crypted_password + database_username
  end

  def user_database_host
    self.database_host
  end

  def reset_pooled_connections
    # Only close connections to this users' database
    $pool.close_connections!(self.database_name)
  end

  def in_database(options = {}, &block)
    configuration = get_db_configuration_for(options[:as])

    connection = $pool.fetch(configuration) do
      db = ::Sequel.connect(configuration.merge(:after_connect=>(proc do |conn|
        conn.execute(%Q{ SET search_path TO "#{self.database_schema}", cartodb, public })
      end)))
      db.extension(:connection_validator)
      db.pool.connection_validation_timeout = configuration.fetch('conn_validator_timeout', 900)
      db
    end

    if block_given?
      yield(connection)
    else
      connection
    end
  end

  def get_db_configuration_for(user = nil)
    logger = (Rails.env.development? || Rails.env.test? ? ::Rails.logger : nil)
    if user == :superuser
      ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        'database' => self.database_name,
        :logger => logger,
        'host' => self.database_host
      ) {|key, o, n| n.nil? ? o : n}
    elsif user == :public_user
      ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        'database' => self.database_name,
        :logger => logger,
        'username' => CartoDB::PUBLIC_DB_USER, 'password' => CartoDB::PUBLIC_DB_USER_PASSWORD,
        'host' => self.database_host
      ) {|key, o, n| n.nil? ? o : n}
    else
      ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        'database' => self.database_name,
        :logger => logger,
        'username' => database_username,
        'password' => database_password,
        'host' => self.database_host
      ) {|key, o, n| n.nil? ? o : n}
    end
  end


  def run_pg_query(query)
    time = nil
    res  = nil
    translation_proc = nil
    in_database do |user_database|
      time = Benchmark.measure {
        user_database.synchronize do |conn|
          res = conn.exec query
        end
        translation_proc = user_database.conversion_procs
      }
    end
    {
      :time          => time.real,
      :total_rows    => res.ntuples,
      :rows          => pg_to_hash(res, translation_proc),
      :results       => pg_results?(res),
      :modified      => pg_modified?(res),
      :affected_rows => pg_size(res)
    }
    rescue => e
    if e.is_a? PGError
      if e.message.include?("does not exist")
        if e.message.include?("column")
          raise CartoDB::ColumnNotExists, e.message
        else
          raise CartoDB::TableNotExists, e.message
        end
      else
        raise CartoDB::ErrorRunningQuery, e.message
      end
    else
      raise e
    end
  end

  # List all public visualization tags of the user
  def tags(exclude_shared=false, type=CartoDB::Visualization::Member::DERIVED_TYPE)
    require_relative './visualization/tags'
    options = {}
    options[:exclude_shared] = true if exclude_shared
    CartoDB::Visualization::Tags.new(self, options).names({
      type: type,
      privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC
    })
  end #tags

  # List all public map tags of the user
  def map_tags
    require_relative './visualization/tags'
    CartoDB::Visualization::Tags.new(self).names({
       type: CartoDB::Visualization::Member::CANONICAL_TYPE,
       privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC
    })
  end #map_tags

  def tables
    ::Table.filter(:user_id => self.id).order(:id).reverse
  end

  def tables_including_shared
    CartoDB::Visualization::Collection.new.fetch(
        user_id: self.id,
        type: CartoDB::Visualization::Member::CANONICAL_TYPE
    ).map { |item|
      item.table
    }
  end

  def load_avatar
    if self.avatar_url.nil?
      self.reload_avatar
    end
  end

  def reload_avatar
    request = Typhoeus::Request.new(
      self.gravatar(protocol = 'http://', 128, default_image = '404'),
      method: :get
    )
    response = request.run
    if response.code == 200 
      # First try to update the url with the user gravatar
      self.avatar_url = "//#{gravatar_user_url}"
      self.this.update avatar_url: self.avatar_url
    else
      # If the user doesn't have gravatar try to get a cartodb avatar
      if self.avatar_url.nil? || self.avatar_url == "//#{default_avatar}"
        # Only update the avatar if the user avatar is nil or the default image
        self.avatar_url = "//#{cartodb_avatar}"
        self.this.update avatar_url: self.avatar_url
      end
    end 
  end

  def cartodb_avatar
    puts Cartodb.config[:avatars]
    if !Cartodb.config[:avatars].nil? && 
       !Cartodb.config[:avatars]['base_url'].nil? && !Cartodb.config[:avatars]['base_url'].empty? &&
       !Cartodb.config[:avatars]['kinds'].nil? && !Cartodb.config[:avatars]['kinds'].empty? &&
       !Cartodb.config[:avatars]['colors'].nil? && !Cartodb.config[:avatars]['colors'].empty?
      avatar_base_url = Cartodb.config[:avatars]['base_url']
      avatar_kind = Cartodb.config[:avatars]['kinds'][Random.new.rand(0..Cartodb.config[:avatars]['kinds'].length - 1)]
      avatar_color = Cartodb.config[:avatars]['colors'][Random.new.rand(0..Cartodb.config[:avatars]['colors'].length - 1)]
      return "#{avatar_base_url}/avatar_#{avatar_kind}_#{avatar_color}.png"
    else
      CartoDB::Logger.info "Attribute avatars_base_url not found in config. Using default avatar"
      return default_avatar
    end
  end

  def default_avatar
    return "cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png"
  end

  def gravatar(protocol = "http://", size = 128, default_image = default_avatar)
    "#{protocol}#{self.gravatar_user_url}?s=#{size}&d=#{protocol}#{URI.encode(default_image)}"
  end #gravatar

  def gravatar_user_url
    digest = Digest::MD5.hexdigest(email.downcase)
    return "gravatar.com/avatar/#{digest}"
  end

  # Retrive list of user tables from database catalogue
  #
  # You can use this to check for dangling records in the
  # admin db "user_tables" table.
  #
  # NOTE: this currently returns all public tables, can be
  #       improved to skip "service" tables
  #
  def tables_effective
    in_database do |user_database|
      user_database.synchronize do |conn|
        query = "select table_name::text from information_schema.tables where table_schema = 'public'"
        tables = user_database[query].all.map { |i| i[:table_name] }
        return tables
      end
    end
  end

  # Gets the list of OAuth accounts the user has (currently only used for synchronization)
  # @return CartoDB::OAuths
  def oauths
    @oauths ||= CartoDB::OAuths.new(self)
  end

  def trial_ends_at
    if account_type.to_s.downcase == 'magellan' && upgraded_at && upgraded_at + 15.days > Date.today
      upgraded_at + 15.days
    else
      nil
    end
  end

  def dedicated_support?
    /(FREE|MAGELLAN|JOHN SNOW|ACADEMY|ACADEMIC|ON HOLD)/i.match(self.account_type) ? false : true
  end

  def remove_logo?
    /(FREE|MAGELLAN|JOHN SNOW|ACADEMY|ACADEMIC|ON HOLD)/i.match(self.account_type) ? false : true
  end

  def soft_geocoding_limit?
    if self[:soft_geocoding_limit].nil?
      plan_list = "ACADEMIC|Academy|Academic|INTERNAL|FREE|AMBASSADOR|ACADEMIC MAGELLAN|PARTNER|FREE|Magellan|Academy|ACADEMIC|AMBASSADOR"
      (self.account_type =~ /(#{plan_list})/ ? false : true)
    else
      self[:soft_geocoding_limit]
    end
  end
  alias_method :soft_geocoding_limit, :soft_geocoding_limit?

  def hard_geocoding_limit?
    !self.soft_geocoding_limit?
  end
  alias_method :hard_geocoding_limit, :hard_geocoding_limit?

  def hard_geocoding_limit=(val)
    self[:soft_geocoding_limit] = !val
  end

  def private_maps_enabled
    /(FREE|MAGELLAN|JOHN SNOW|ACADEMY|ACADEMIC|ON HOLD)/i.match(self.account_type) ? false : true
  end

  def import_quota
    self.account_type.downcase == 'free' ? 1 : 3
  end

  def view_dashboard
    self.this.update dashboard_viewed_at: Time.now
    set dashboard_viewed_at: Time.now
  end

  def dashboard_viewed?
    !!dashboard_viewed_at
  end

  # create the core user_metadata key that is used in redis
  def key
    "rails:users:#{username}"
  end

  # save users basic metadata to redis for node sql api to use
  def save_metadata
    $users_metadata.HMSET key,
      'id', id,
      'database_name', database_name,
      'database_password', database_password,
      'database_host', database_host,
      'database_publicuser', database_public_username,
      'map_key', api_key
  end

  def get_auth_tokens
    tokens = [get_auth_token]
    if has_organization?
      tokens << organization.get_auth_token
    end
    tokens
  end

  def get_auth_token
    if self.auth_token.nil?
      self.auth_token = make_auth_token
      self.save
    end
    self.auth_token
  end

  # Returns an array representing the last 30 days, populated with api_calls
  # from three different sources
  def get_api_calls(options = {})
    date_to = (options[:to] ? options[:to].to_date : Date.today)
    date_from = (options[:from] ? options[:from].to_date : Date.today - 29.days)
    calls = $users_metadata.pipelined do
      date_to.downto(date_from) do |date|
        $users_metadata.ZSCORE "user:#{username}:mapviews:global", date.strftime("%Y%m%d")
      end
    end.map &:to_i

    # Add old api calls
    old_calls = get_old_api_calls["per_day"].to_a.reverse rescue []
    calls = calls.zip(old_calls).map { |pair|
      pair[0].to_i + pair[1].to_i
    } unless old_calls.blank?

    # Add ES api calls
    es_calls = get_es_api_calls_from_redis(options) rescue []
    calls = calls.zip(es_calls).map { |pair|
      pair[0].to_i + pair[1].to_i
    } unless es_calls.blank?

    return calls
  end

  def get_geocoding_calls(options = {})
    date_to = (options[:to] ? options[:to].to_date : Date.today)
    date_from = (options[:from] ? options[:from].to_date : self.last_billing_cycle)
    self.geocodings_dataset.where(kind: 'high-resolution').where('created_at >= ? and created_at <= ?', date_from, date_to + 1.days)
      .sum("processed_rows + cache_hits".lit).to_i
  end # get_geocoding_calls

  # Get ES api calls from redis
  def get_es_api_calls_from_redis(options = {})
    date_to = (options[:to] ? options[:to].to_date : Date.today)
    date_from = (options[:from] ? options[:from].to_date : Date.today - 29.days)
    es_calls = $users_metadata.pipelined do
      date_to.downto(date_from) do |date|
        $users_metadata.ZSCORE "user:#{self.username}:mapviews_es:global", date.strftime("%Y%m%d")
      end
    end.map &:to_i
    return es_calls
  end

  def remaining_geocoding_quota
    if organization.present?
      remaining = organization.geocoding_quota - organization.get_geocoding_calls
    else
      remaining = geocoding_quota - get_geocoding_calls
    end
    (remaining > 0 ? remaining : 0)
  end

  # Get the api calls from ES and sum them to the stored ones in redis
  # Returns the final sum of them
  def get_api_calls_from_es
    require 'date'
    yesterday = Date.today - 1
    from_date = DateTime.new(yesterday.year, yesterday.month, yesterday.day, 0, 0, 0).strftime("%Q")
    to_date = DateTime.now.strftime("%Q")
    request_body = Cartodb.config[:api_requests_es_service]['body']
    request_url = Cartodb.config[:api_requests_es_service]['url']
    request_body.gsub!("$CDB_SUBDOMAIN$", self.username + Cartodb.config[:session_domain])
    request_body.gsub!("\"$FROM$\"", from_date)
    request_body.gsub!("\"$TO$\"", to_date)
    request = Typhoeus::Request.new(
      request_url,
      method: :post,
      headers: { "Content-Type" => "application/json" },
      body: request_body
    )
    response = request.run
    if response.code != 200
      raise(response.body)
    end
    values = {}
    JSON.parse(response.body)["aggregations"]["0"]["buckets"].each {|i| values[i['key']] = i['doc_count']}
    return values
  end

  # Get the final api calls from ES and write them to redis
  def set_api_calls_from_es(options = {})
    if options[:force_update]
      es_api_calls = get_api_calls_from_es
      es_api_calls.each do |d,v|
        $users_metadata.ZADD "user:#{self.username}:mapviews_es:global", v, DateTime.strptime(d.to_s, "%Q").strftime("%Y%m%d")
      end
    end
  end

  # Legacy stats fetching

    def get_old_api_calls
      JSON.parse($users_metadata.HMGET(key, 'api_calls').first) rescue {}
    end

    def set_old_api_calls(options = {})
      # Ensure we update only once every 3 hours
      if options[:force_update] || get_old_api_calls["updated_at"].to_i < 3.hours.ago.to_i
        api_calls = JSON.parse(
          open("#{Cartodb.config[:api_requests_service_url]}?username=#{self.username}").read
        ) rescue {}

        # Manually set updated_at
        api_calls["updated_at"] = Time.now.to_i
        $users_metadata.HMSET key, 'api_calls', api_calls.to_json
      end
    end

  def last_billing_cycle
    day = period_end_date.day rescue 29.days.ago.day
    date = (day > Date.today.day ? Date.today<<1 : Date.today)
    begin
      Date.parse("#{date.year}-#{date.month}-#{day}")
    rescue ArgumentError
      day = day - 1
      retry
    end
  end

  def set_last_active_time
    $users_metadata.HMSET key, 'last_active_time',  Time.now
  end

  def get_last_active_time
    $users_metadata.HMGET(key, 'last_active_time').first
  end

  def set_last_ip_address(ip_address)
    $users_metadata.HMSET key, 'last_ip_address',  ip_address
  end

  def get_last_ip_address
    $users_metadata.HMGET(key, 'last_ip_address').first
  end

  def reset_client_application!
    if client_application
      client_application.destroy
    end
    ClientApplication.create(:user_id => self.id)
  end

  def self.find_with_custom_fields(user_id)
    User.filter(:id => user_id).select(:id,:email,:username,:tables_count,:crypted_password,:database_name,:admin).first
  end


  def enabled?
    self.enabled
  end

  def disabled?
    !self.enabled
  end

  def database_exists?
    return false if database_name.blank?
    connection_params = ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
      'host' => self.database_host,
      'database' => 'postgres'
    ) {|key, o, n| n.nil? ? o : n}
    conn = ::Sequel.connect(connection_params.merge(:after_connect=>(proc do |conn|
      conn.execute(%Q{ SET search_path TO "#{self.database_schema}", cartodb, public })
    end)))
    conn[:pg_database].filter(:datname => database_name).all.any?
  end

  private :database_exists?

  # This method is innaccurate and understates point based tables (the /2 is to account for the_geom_webmercator)
  # TODO: Without a full table scan, ignoring the_geom_webmercator, we cannot accuratly asses table size
  # Needs to go on a background job.
  def db_size_in_bytes(use_total = false)
    attempts = 0
    begin
      # Hack to support users without the new MU functiones loaded
      user_data_size_function = self.cartodb_extension_version_pre_mu? ? "CDB_UserDataSize()" : "CDB_UserDataSize('#{self.database_schema}')"
      result = in_database(:as => :superuser).fetch("SELECT cartodb.#{user_data_size_function}").first[:cdb_userdatasize]
      update_gauge("db_size", result)
      result
    rescue
      attempts += 1
      in_database(:as => :superuser).fetch("ANALYZE")
      retry unless attempts > 1
    end
  end

  def real_tables
    self.in_database(:as => :superuser)
    .select(:pg_class__oid, :pg_class__relname)
    .from(:pg_class)
    .join_table(:inner, :pg_namespace, :oid => :relnamespace)
    .where(:relkind => 'r', :nspname => 'public')
    .exclude(:relname => SYSTEM_TABLE_NAMES)
    .all
  end

  # Looks for tables created on the user database
  # but not linked to the Rails app database. Creates/Updates/Deletes
  # required records to sync them
  def link_ghost_tables
    return true if self.real_tables.blank?
    link_outdated_tables
    # link_created_tables
    # link_renamed_tables
    link_deleted_tables
  end

  def link_outdated_tables
    # Link tables without oid
    metadata_tables_without_id = self.tables.where(table_id: nil).map(&:name)
    outdated_tables = real_tables.select{|t| metadata_tables_without_id.include?(t[:relname])}
    outdated_tables.each do |t|
      table = self.tables.where(name: t[:relname]).first
      begin
        table.this.update table_id: t[:oid]
      rescue Sequel::DatabaseError => e
        raise unless e.message =~ /must be owner of relation/
      end
    end

    # Link tables which oid has changed
    self.tables.where(
      "table_id not in ?", self.real_tables.map {|t| t[:oid]}
    ).each do |table|
      real_table_id = table.get_table_id
      table.this.update(table_id: real_table_id) unless real_table_id.blank?
    end
  end

  def link_created_tables
    created_tables = real_tables.reject{|t| metadata_tables_ids.include?(t[:oid])}
    created_tables.each do |t|
      table = Table.new
      table.user_id  = self.id
      table.name     = t[:relname]
      table.table_id = t[:oid]
      table.migrate_existing_table = t[:relname]
      begin
        table.save
      rescue Sequel::DatabaseError => e
        raise unless e.message =~ /must be owner of relation/
      end
    end
  end

  def link_renamed_tables
    metadata_table_names = self.tables.select(:name).map(&:name)
    renamed_tables       = real_tables.reject{|t| metadata_table_names.include?(t[:relname])}.select{|t| metadata_tables_ids.include?(t[:oid])}
    renamed_tables.each do |t|
      table = Table.find(:table_id => t[:oid])
      begin
        table.synchronize_name(t[:relname])
      rescue Sequel::DatabaseError => e
        raise unless e.message =~ /must be owner of relation/
      end
    end
  end

  def link_deleted_tables
    metadata_tables_ids = self.tables.select(:table_id).map(&:table_id)
    dropped_tables = metadata_tables_ids - real_tables.map{|t| t[:oid]}

    # Remove tables with oids that don't exist on the db
    self.tables.where(table_id: dropped_tables).all.each do |table|
      table.keep_user_database_table = true
      table.destroy
    end if dropped_tables.present?

    # Remove tables with null oids unless the table name
    # exists on the db
    self.tables.filter(table_id: nil).all.each do |t|
      t.keep_user_database_table = true
      t.destroy unless self.real_tables.map { |t| t[:relname] }.include?(t.name)
    end if dropped_tables.present? && dropped_tables.include?(nil)
  end

  def exceeded_quota?
    self.over_disk_quota? || self.over_table_quota?
  end

  def remaining_quota(use_total = false)
    self.quota_in_bytes - self.db_size_in_bytes(use_total)
  end

  def disk_quota_overspend
    self.over_disk_quota? ? self.remaining_quota.abs : 0
  end

  def over_disk_quota?
    self.remaining_quota <= 0
  end

  def over_table_quota?
    (remaining_table_quota && remaining_table_quota <= 0) ? true : false
  end

  def account_type_name
    self.account_type.gsub(' ', '_').downcase
    rescue
    ''
  end

  #can be nil table quotas
  def remaining_table_quota
    if self.table_quota.present?
      remaining = self.table_quota - self.table_count
      (remaining < 0) ? 0 : remaining
    end
  end

  # Only returns owned tables (not shared ones)
  def table_count(privacy_filter=nil)
    filter = {
        user_id: self.id
    }
    filter[:privacy] = privacy_filter unless privacy_filter.nil?
    Table.filter(filter).count
  end #table_count

  def failed_import_count
    DataImport.where(user_id: self.id, state: 'failure').count
  end

  def success_import_count
    DataImport.where(user_id: self.id, state: 'complete').count
  end

  def import_count
    DataImport.where(user_id: self.id).count
  end

  # Get the count of public visualizations
  def public_visualization_count
    visualization_count(
      CartoDB::Visualization::Member::DERIVED_TYPE,
      CartoDB::Visualization::Member::PRIVACY_PUBLIC,
      true
    )
  end #public_visualization_count

  # Get a count of visualizations with optional type and privacy filters
  def visualization_count(type_filter=nil, privacy_filter=nil, exclude_shared=false)
    parameters = {
      user_id: self.id
    }
    parameters[:type] = type_filter unless type_filter.nil?
    parameters[:privacy] = privacy_filter unless privacy_filter.nil?
    parameters[:exclude_shared] = true if exclude_shared

    CartoDB::Visualization::Collection.new.fetch(parameters).count
  end #visualization_count

  def last_visualization_created_at
    Rails::Sequel.connection.fetch("SELECT created_at FROM visualizations WHERE " +
      "map_id IN (select id FROM maps WHERE user_id=?) ORDER BY created_at DESC " +
      "LIMIT 1;", id)
      .to_a.fetch(0, {}).fetch(:created_at, nil)
  end

  def metric_key
    "cartodb.#{Rails.env.production? ? "user" : Rails.env + "-user"}.#{self.username}"
  end

  def update_gauge(gauge, value)
    Statsd.gauge("#{metric_key}.#{gauge}", value)
  rescue
  end

  def update_visualization_metrics
    update_gauge("visualizations.total", maps.count)
    update_gauge("visualizations.table", table_count)
    update_gauge("visualizations.derived", visualization_count(nil,nil,true))
  end

  def rebuild_quota_trigger
    puts "Setting user quota in db '#{database_name}' (#{username})"
    in_database(:as => :superuser) do |db|
      db.transaction do
        # NOTE: this has been written to work for both
        #       databases that switched to "cartodb" extension
        #       and those before the switch.
        #       In the future we should guarantee that exntension
        #       lives in cartodb schema so we don't need to set
        #       a search_path before
        search_path = db.fetch("SHOW search_path;").first[:search_path]
        db.run("SET search_path TO cartodb, public;")
        if cartodb_extension_version_pre_mu?
          db.run("SELECT CDB_SetUserQuotaInBytes(#{self.quota_in_bytes});")
        else
          db.run("SELECT CDB_SetUserQuotaInBytes('#{self.database_schema}', #{self.quota_in_bytes});")
        end
        db.run("SET search_path TO #{search_path};")
      end
    end
  end

  def importing_jobs
    imports = DataImport.where(state: ['complete', 'failure']).invert
      .where(user_id: self.id)
      .where { created_at > Time.now - 24.hours }.all
    running_import_ids = Resque::Worker.all.map { |worker| worker.job["payload"]["args"].first["job_id"] rescue nil }.compact
    imports.map do |import|
      if import.created_at < Time.now - 5.minutes && !running_import_ids.include?(import.id)
        import.handle_failure
        nil
      else
        import
      end
    end.compact
  end

  def job_tracking_identifier
    "account#{self.username}"
  end

  def partial_db_name
    if self.has_organization_enabled?
      self.organization.owner_id
    else
      self.id
    end
  end

  def has_organization_enabled?
    if self.has_organization? && self.organization.owner.present?
      true
    else
      false
    end
  end

  def has_organization?
    !!self.organization
  end

  def organization_owner?
    self.organization.present? && self.organization.owner == self
  end

  def organization_user?
    self.organization.present?
  end

  def create_client_application
    ClientApplication.create(:user_id => self.id)
  end

  def create_db_user
    connection_params = ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
      'host' => self.database_host,
      'database' => 'postgres'
    ) {|key, o, n| n.nil? ? o : n}
    conn = ::Sequel.connect(connection_params)
    begin
      conn.run("CREATE USER \"#{database_username}\" PASSWORD '#{database_password}'")
    rescue => e
      puts "#{Time.now} USER SETUP ERROR (#{database_username}): #{$!}"
      raise e
    end
  end

  def create_public_db_user
    in_database(as: :superuser) do |database|
      database.run(%Q{ CREATE USER \"#{database_public_username}\" LOGIN INHERIT })
      database.run(%Q{ GRANT publicuser TO \"#{database_public_username}\" })
      database.run(%Q{ ALTER USER \"#{database_public_username}\" SET search_path = \"#{database_schema}\", public, cartodb })
    end
  end

  def create_user_db
    connection_params = ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
      'host' => self.database_host,
      'database' => 'postgres'
    ) {|key, o, n| n.nil? ? o : n}
    conn = ::Sequel.connect(connection_params)
    begin
      conn.run("CREATE DATABASE \"#{self.database_name}\"
      WITH TEMPLATE = template_postgis
      OWNER = #{::Rails::Sequel.configuration.environment_for(Rails.env)['username']}
      ENCODING = 'UTF8'
      CONNECTION LIMIT=-1")
    rescue => e
      puts "#{Time.now} USER SETUP ERROR WHEN CREATING DATABASE #{self.database_name}: #{$!}"
      raise e
    end
  end

  def set_database_name
    # Assign database_name
    self.database_name = case Rails.env
      when 'development'
        "cartodb_dev_user_#{self.partial_db_name}_db"
      when 'staging'
        "cartodb_staging_user_#{self.partial_db_name}_db"
      when 'test'
        "cartodb_test_user_#{self.partial_db_name}_db"
      else
        "cartodb_user_#{self.partial_db_name}_db"
    end
    if self.has_organization_enabled?
      if !database_exists?
        raise "Organization database #{database_name} doesn't exist"
      end
    else
      if database_exists?
        raise "Database #{database_name} already exists"
      end
    end
    self.this.update database_name: self.database_name
  end

  def setup_new_user
    self.create_client_application
    Thread.new do
      self.create_db_user
      self.create_user_db
      self.grant_owner_in_database
    end.join
    self.create_importer_schema
    self.create_geocoding_schema
    self.load_cartodb_functions
    self.set_database_search_path
    self.reset_database_permissions # Reset privileges
    self.grant_publicuser_in_database
    self.set_user_privileges # Set privileges
    self.set_user_as_organization_member
    self.rebuild_quota_trigger
    self.create_function_invalidate_varnish
  end

  def setup_organization_user
    self.create_client_application
    Thread.new do
      self.create_db_user
      self.grant_user_in_database
    end.join
    self.load_cartodb_functions
    self.database_schema = self.username
    self.this.update database_schema: self.database_schema
    self.create_user_schema
    self.set_database_search_path
    self.create_public_db_user
    self.reset_user_schema_permissions # Reset privileges
    self.set_user_privileges # Set privileges
    self.set_user_as_organization_member
    self.rebuild_quota_trigger
  end

  def grant_owner_in_database
    self.run_queries_in_transaction(
      self.grant_all_on_database_queries,
      true
    )
  end

  def grant_user_in_database
    self.run_queries_in_transaction(
      self.grant_connect_on_database_queries,
      true
    )
  end

  def grant_publicuser_in_database
    self.run_queries_in_transaction(
      self.grant_connect_on_database_queries(CartoDB::PUBLIC_DB_USER),
      true
    )
    self.run_queries_in_transaction(
      self.grant_read_on_schema_queries('cartodb', CartoDB::PUBLIC_DB_USER),
      true
    )
    self.run_queries_in_transaction(
      [
        "GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO #{CartoDB::PUBLIC_DB_USER}",
        "GRANT SELECT ON spatial_ref_sys TO #{CartoDB::PUBLIC_DB_USER}"
      ],
      true
    )
  end

  def set_user_privileges_in_cartodb_schema # MU
    # Privileges in cartodb schema
    self.run_queries_in_transaction(
      (
        self.grant_read_on_schema_queries('cartodb') +
        self.grant_write_on_cdb_tablemetadata_queries
      ),
      true
    )
  end

  def set_user_privileges_in_public_schema # MU
    # Privileges in public schema
    self.run_queries_in_transaction(
      self.grant_read_on_schema_queries('public'),
      true
    )
  end

  def set_user_privileges_in_own_schema # MU
    # Privileges in its own schema
    self.run_queries_in_transaction(
      self.grant_all_on_user_schema_queries,
      true
    )
  end

  def set_user_privileges_in_importer_schema # MU
    # Privileges in cdb_importer_schema
    self.run_queries_in_transaction(
      self.grant_all_on_schema_queries('cdb_importer'),
      true
    )
  end

  def set_user_privileges_in_geocoding_schema
    self.run_queries_in_transaction(
        self.grant_all_on_schema_queries('cdb'),
        true
    )
  end

  def set_privileges_to_publicuser_in_own_schema # MU
    # Privileges in user schema for publicuser
    self.run_queries_in_transaction(
      self.grant_usage_on_user_schema_to_other(CartoDB::PUBLIC_DB_USER),
      true
    )
  end

  def set_user_privileges # MU
    self.set_user_privileges_in_cartodb_schema
    self.set_user_privileges_in_public_schema
    self.set_user_privileges_in_own_schema
    self.set_user_privileges_in_importer_schema
    self.set_user_privileges_in_geocoding_schema
    self.set_privileges_to_publicuser_in_own_schema
  end



  ## User's databases setup methods
  def setup_user
    return if disabled?
    self.set_database_name

    if self.has_organization_enabled?
      self.setup_organization_user
    else
      if self.has_organization?
        raise "It's not possible to create a user within a inactive organization"
      else
        self.setup_new_user
      end
    end
    #set_user_as_organization_owner_if_needed
  end

  def set_database_search_path
    in_database(as: :superuser) do |database|
      database.run(%Q{ ALTER USER "#{database_username}" SET search_path = "#{database_schema}", public, cartodb })
    end
  end

  def create_importer_schema
    create_schema('cdb_importer')
  end

  def create_geocoding_schema
    create_schema('cdb')
  end

  def create_user_schema
    create_schema(self.database_schema, self.database_username)
  end

  # Attempts to create a new database schema
  # Does not raise exception if the schema already exists
  def create_schema(schema, role = nil)
    in_database(as: :superuser) do |database|
      if role
        database.run(%Q{CREATE SCHEMA \"#{schema}\" AUTHORIZATION "#{role}"})
      else
        database.run(%Q{CREATE SCHEMA \"#{schema}\"})
      end
    end
  rescue Sequel::DatabaseError => e
    raise unless e.message =~ /schema .* already exists/
  end #create_schema

  # Add plpythonu pl handler
  def add_python
    in_database(
      :as => :superuser,
      no_cartodb_in_schema: true
    ).run(<<-SQL
      CREATE OR REPLACE PROCEDURAL LANGUAGE 'plpythonu' HANDLER plpython_call_handler;
    SQL
    )
  end

  # Create a "public.cdb_invalidate_varnish()" function to invalidate Varnish
  #
  # The function can only be used by the superuser, we expect
  # security-definer triggers OR triggers on superuser-owned tables
  # to call it with controlled set of parameters.
  #
  # The function is written in python because it needs to reach out
  # to a Varnish server.
  #
  # Being unable to communicate with Varnish may or may not be critical
  # depending on CartoDB configuration at time of function definition.
  #
  def create_function_invalidate_varnish

    add_python

    varnish_host = Cartodb.config[:varnish_management].try(:[],'host') || '127.0.0.1'
    varnish_port = Cartodb.config[:varnish_management].try(:[],'port') || 6082
    varnish_timeout = Cartodb.config[:varnish_management].try(:[],'timeout') || 5
    varnish_critical = Cartodb.config[:varnish_management].try(:[],'critical') == true ? 1 : 0
    varnish_retry = Cartodb.config[:varnish_management].try(:[],'retry') || 5
    purge_command = Cartodb::config[:varnish_management]["purge_command"]



    in_database(:as => :superuser).run(<<-TRIGGER
    BEGIN;
    CREATE OR REPLACE FUNCTION public.cdb_invalidate_varnish(table_name text) RETURNS void AS
    $$
        critical = #{varnish_critical}
        timeout = #{varnish_timeout}
        retry = #{varnish_retry}

        client = GD.get('varnish', None)

        while True:

          if not client:
              try:
                import varnish
                client = GD['varnish'] = varnish.VarnishHandler(('#{varnish_host}', #{varnish_port}, timeout))
              except Exception as err:
                # NOTE: we won't retry on connection error
                if critical:
                  plpy.error('Varnish connection error: ' +  str(err))
                break

          try:
            # NOTE: every table change also changed CDB_TableMetadata, so
            #       we purge those entries too
            #
            # TODO: check if any server is ever setting "table" as the
            #       surrogate key, as that looks redundant to me
            #       --strk-20131203;
            #
            # TODO: do not invalidate responses with surrogate key
            #       "not_this_one" when table "this" changes :/
            #       --strk-20131203;
            #
            client.fetch('#{purge_command} obj.http.X-Cache-Channel ~ "^#{self.database_name}:(.*%s.*)|(cdb_tablemetadata)|(table)$"' % table_name.replace('"',''))
            break
          except Exception as err:
            plpy.warning('Varnish fetch error: ' + str(err))
            client = GD['varnish'] = None # force reconnect
            if not retry:
              if critical:
                plpy.error('Varnish fetch error: ' +  str(err))
              break
            retry -= 1 # try reconnecting
    $$
    LANGUAGE 'plpythonu' VOLATILE;
    REVOKE ALL ON FUNCTION public.cdb_invalidate_varnish(TEXT) FROM PUBLIC;
    COMMIT;
TRIGGER
    )
  end

  def cartodb_extension_version
    version, revision = self.in_database(:as => :superuser).fetch("select cartodb.cdb_version() as v").first[:v].split(" ")
    return [version, revision]
  end

  def cartodb_extension_version_pre_mu?
    current_version_match = /(\d\.\d\.\d).*/.match(self.cartodb_extension_version.first)
    if current_version_match.nil?
      raise "Current cartodb extension version does not match standard x.y.z format"
    else
      current_version_match[1] < '0.3.0'
    end
  end

  # Cartodb functions
  def load_cartodb_functions(statement_timeout = nil)

    tgt_ver = '0.3.0' # TODO: optionally take as parameter?
    tgt_rev = '0.3.0'

    add_python

    in_database({
                    as: :superuser,
                    no_cartodb_in_schema: true
                }) do |db|
      db.transaction do

        unless statement_timeout.nil?
          old_timeout = db.fetch("SHOW statement_timeout;").first[:statement_timeout]
          db.run("SET statement_timeout TO '#{statement_timeout}';")
        end

        db.run('CREATE EXTENSION plpythonu FROM unpackaged') unless db.fetch(%Q{
            SELECT count(*) FROM pg_extension WHERE extname='plpythonu'
          }).first[:count] > 0
        db.run('CREATE EXTENSION schema_triggers') unless db.fetch(%Q{
            SELECT count(*) FROM pg_extension WHERE extname='schema_triggers'
          }).first[:count] > 0
        db.run('CREATE EXTENSION postgis FROM unpackaged') unless db.fetch(%Q{
            SELECT count(*) FROM pg_extension WHERE extname='postgis'
          }).first[:count] > 0

        db.run(%Q{
    DO LANGUAGE 'plpgsql' $$
    DECLARE
      ver TEXT;
    BEGIN
      BEGIN
        SELECT cartodb.cdb_version() INTO ver;
      EXCEPTION WHEN undefined_function OR invalid_schema_name THEN
        RAISE NOTICE 'Got % (%)', SQLERRM, SQLSTATE;
        BEGIN
          CREATE EXTENSION cartodb VERSION '#{tgt_ver}' FROM unpackaged;
        EXCEPTION WHEN undefined_table THEN
          RAISE NOTICE 'Got % (%)', SQLERRM, SQLSTATE;
          CREATE EXTENSION cartodb VERSION '#{tgt_ver}';
          RETURN;
        END;
        RETURN;
      END;
      ver := '#{tgt_ver}';
      IF position('dev' in ver) > 0 THEN
        EXECUTE 'ALTER EXTENSION cartodb UPDATE TO ''' || ver || 'next''';
        EXECUTE 'ALTER EXTENSION cartodb UPDATE TO ''' || ver || '''';
      ELSE
        EXECUTE 'ALTER EXTENSION cartodb UPDATE TO ''' || ver || '''';
      END IF;
    END;
    $$;
        })

        unless statement_timeout.nil?
          db.run("SET statement_timeout TO '#{old_timeout}';")
        end

        expected = "#{tgt_ver} #{tgt_rev}"
        obtained = db.fetch('SELECT cartodb.cdb_version() as v').first[:v]

        raise("Expected cartodb extension '#{expected}' obtained '#{obtained}'") unless expected == obtained

#       db.run('SELECT cartodb.cdb_enable_ddl_hooks();')
      end
    end

    # We reset the connections to this database to be sure
    # the change in default search_path is effective
    # TODO: only reset IFF migrating from pre-extension times
    self.reset_pooled_connections

  end

  def set_statement_timeouts
    in_database(as: :superuser) do |user_database|
      user_database["ALTER ROLE \"?\" SET statement_timeout to ?", database_username.lit, user_timeout].all
      user_database["ALTER DATABASE \"?\" SET statement_timeout to ?", database_name.lit, database_timeout].all
    end
    in_database.disconnect
    in_database.connect(get_db_configuration_for)
    in_database(as: :public_user).disconnect
    in_database(as: :public_user).connect(get_db_configuration_for(:public_user))
  rescue Sequel::DatabaseConnectionError => e
  end

  def run_queries_in_transaction(queries, superuser = false)
    conn_params = {}
    if superuser
      conn_params[:as] = :superuser
    end
    in_database(conn_params) do |user_database|
      user_database.transaction do
        queries.each do |q|
          user_database.run(q)
        end
        yield(user_database) if block_given?
      end
    end
  end

  def set_user_as_organization_member
    in_database(:as => :superuser) do |user_database|
      user_database.transaction do
        user_database.run("SELECT cartodb.CDB_Organization_Create_Member('#{database_username}');")
      end
    end
  end

  def set_user_as_organization_owner_if_needed
    if self.organization && self.organization.reload && self.organization.owner.nil? && self.organization.users.count == 1
      self.organization.owner = self
      self.organization.save
    end
  end

  def grant_connect_on_database_queries(db_user = nil)
    granted_user = db_user.nil? ? self.database_username : db_user
    [
      "GRANT CONNECT ON DATABASE \"#{self.database_name}\" TO \"#{granted_user}\""
    ]
  end

  def grant_all_on_database_queries
    [
      "GRANT ALL ON DATABASE \"#{self.database_name}\" TO \"#{self.database_username}\""
    ]
  end

  def grant_read_on_schema_queries(schema, db_user = nil)
    granted_user = db_user.nil? ? self.database_username : db_user
    [
      "GRANT USAGE ON SCHEMA \"#{schema}\" TO \"#{granted_user}\"",
      "GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA \"#{schema}\" TO \"#{granted_user}\"",
      "GRANT SELECT ON ALL TABLES IN SCHEMA \"#{schema}\" TO \"#{granted_user}\""
    ]
  end

  def grant_write_on_cdb_tablemetadata_queries
    [
      "GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE cartodb.cdb_tablemetadata TO \"#{database_username}\""
    ]
  end

  def grant_all_on_user_schema_queries
    [
      "GRANT ALL ON SCHEMA \"#{self.database_schema}\" TO \"#{database_username}\"",
      "GRANT ALL ON ALL SEQUENCES IN SCHEMA  \"#{self.database_schema}\" TO \"#{database_username}\"",
      "GRANT ALL ON ALL FUNCTIONS IN SCHEMA  \"#{self.database_schema}\" TO \"#{database_username}\"",
      "GRANT ALL ON ALL TABLES IN SCHEMA  \"#{self.database_schema}\" TO \"#{database_username}\""
    ]
  end

  def grant_usage_on_user_schema_to_other(granted_user)
    [
      "GRANT USAGE ON SCHEMA \"#{self.database_schema}\" TO \"#{granted_user}\""
    ]
  end

  def grant_all_on_schema_queries(schema)
    [
      "GRANT ALL ON SCHEMA \"#{schema}\" TO \"#{database_username}\""
    ]
  end

  def drop_user_privileges_in_schema(schema)
    in_database(:as => :superuser) do |user_database|
      user_database.transaction do
        [self.database_user, self.database_public_user].each do |u|
          user_database.run("REVOKE ALL ON SCHEMA \"#{schema}\" FROM #{u}")
          user_database.run("REVOKE ALL ON ALL SEQUENCES IN SCHEMA \"#{schema}\" FROM #{u}")
          user_database.run("REVOKE ALL ON ALL FUNCTIONS IN SCHEMA \"#{schema}\" FROM #{u}")
          user_database.run("REVOKE ALL ON ALL TABLES IN SCHEMA \"#{schema}\" FROM #{u}")
        end
      end
    end
  end

  def reset_user_schema_permissions
    in_database(:as => :superuser) do |user_database|
      user_database.transaction do
        schemas = [self.database_schema].uniq
        schemas.each do |schema|
          user_database.run("REVOKE ALL ON SCHEMA \"#{schema}\" FROM PUBLIC")
          user_database.run("REVOKE ALL ON ALL SEQUENCES IN SCHEMA \"#{schema}\" FROM PUBLIC")
          user_database.run("REVOKE ALL ON ALL FUNCTIONS IN SCHEMA \"#{schema}\" FROM PUBLIC")
          user_database.run("REVOKE ALL ON ALL TABLES IN SCHEMA \"#{schema}\" FROM PUBLIC")
        end
        yield(user_database) if block_given?
      end
    end
  end

  def reset_database_permissions
    in_database(:as => :superuser) do |user_database|
      user_database.transaction do
        schemas = %w(public cdb_importer cdb cartodb)

        ['PUBLIC', CartoDB::PUBLIC_DB_USER].each do |u|
          user_database.run("REVOKE ALL ON DATABASE \"#{database_name}\" FROM #{u}")
          schemas.each do |schema|
            user_database.run("REVOKE ALL ON SCHEMA \"#{schema}\" FROM #{u}")
            user_database.run("REVOKE ALL ON ALL SEQUENCES IN SCHEMA \"#{schema}\" FROM #{u}")
            user_database.run("REVOKE ALL ON ALL FUNCTIONS IN SCHEMA \"#{schema}\" FROM #{u}")
            user_database.run("REVOKE ALL ON ALL TABLES IN SCHEMA \"#{schema}\" FROM #{u}")
          end
        end
        yield(user_database) if block_given?
      end
    end
  end


  # Utility methods
  def fix_permissions
    self.reset_database_permissions
    self.reset_user_schema_permissions
    self.set_user_privileges
    tables_queries = []
    tables.each do |table|
      if table.public?
        tables_queries << "GRANT SELECT ON \"#{self.database_schema}\".#{table.name} TO #{CartoDB::PUBLIC_DB_USER}"
      end
      tables_queries << "ALTER TABLE \"#{self.database_schema}\".#{table.name} OWNER TO \"#{database_username}\""
    end
    self.run_queries_in_transaction(
      tables_queries,
      true
    )
  end

  def monitor_user_notification
    FileUtils.touch(Rails.root.join('log', 'users_modifications'))
    if !Cartodb.config[:signups].nil? && !Cartodb.config[:signups]["service"].nil? && !Cartodb.config[:signups]["service"]["port"].nil?
      enable_remote_db_user
    end
  end

  def enable_remote_db_user
    request = Typhoeus::Request.new(
      "#{self.database_host}:#{Cartodb.config[:signups]["service"]["port"]}/scripts/activate_db_user",
      method: :post,
      headers: { "Content-Type" => "application/json" }
    )
    response = request.run
    if response.code != 200
      raise(response.body)
    else
      comm_response = JSON.parse(response.body)
      if comm_response['retcode'].to_i != 0
        raise(response['stderr'])
      end
    end
  end

  # return quoated database_schema when needed
  def sql_safe_database_schema
    if self.database_schema.include?('-')
      return "\"#{self.database_schema}\""
    end
    self.database_schema
  end

  private

  def name_exists_in_organizations?
    !Organization.where(name: self.username).first.nil?
  end

  def make_auth_token
    digest = secure_digest(Time.now, (1..10).map{ rand.to_s })
    10.times do
      digest = secure_digest(digest, CartoDB::Visualization::Member::TOKEN_DIGEST)
    end
    digest
  end

  def secure_digest(*args)
    Digest::SHA256.hexdigest(args.flatten.join)
  end

end

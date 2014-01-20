# coding: UTF-8
require_relative './user/user_decorator'

class User < Sequel::Model
  include CartoDB::MiniSequel
  include CartoDB::UserDecorator
  self.strict_param_setting = false

  one_to_one :client_application
  plugin :association_dependencies, :client_application => :destroy
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
  SCHEMAS = %w( public cdb_importer )

  self.raise_on_typecast_failure = false
  self.raise_on_save_failure = false

  ## Validations
  def validate
    super
    validates_presence :username
    validates_unique   :username
    validates_format /^[a-z0-9\-\.]+$/, :username, :message => "must only contain lowercase letters, numbers, dots & hyphens"
    validates_presence :email
    validates_unique   :email, :message => 'is already taken'
    validates_format EmailAddressValidator::Regexp::ADDR_SPEC, :email, :message => 'is not a valid address'
    validates_presence :password if new? && (crypted_password.blank? || salt.blank?)
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

  def after_create
    super
    setup_user
    save_metadata
    monitor_user_notification
    sleep 3
    set_statement_timeouts
  end

  def after_save
    super
    save_metadata
    changes = (self.previous_changes.present? ? self.previous_changes.keys : [])
    set_statement_timeouts if changes.include?(:user_timeout) || changes.include?(:database_timeout)
    rebuild_quota_trigger if changed_columns.include?(:quota_in_bytes)
  end

  def before_destroy
    # Remove user tables
    self.tables.all.each { |t| t.destroy }
    
    # Remove user data imports, maps and layers
    self.data_imports.each { |d| d.destroy }
    self.maps.each { |m| m.destroy }
    self.layers.each { |l| self.remove_layer l }

    # Remove metadata from redis
    $users_metadata.DEL(self.key)

    # Invalidate user cache
    self.invalidate_varnish_cache
  end

  def self.terminate_database_connections(database_name)
      Rails::Sequel.connection.run("
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
  end

  def after_destroy_commit
    # Remove database
    Thread.new do
      conn = Rails::Sequel.connection
      conn.run("UPDATE pg_database SET datallowconn = 'false' WHERE datname = '#{database_name}'")
      User.terminate_database_connections(database_name)
      conn.run("DROP DATABASE #{database_name}")
      conn.run("DROP USER #{database_username}")
    end.join
    monitor_user_notification
  end

  def invalidate_varnish_cache
    CartoDB::Varnish.new.purge("obj.http.X-Cache-Channel ~ #{database_name}.*")
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
    User.where(enabled: true).all.select do |u|
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

  def database_password
    crypted_password + database_username
  end

  def in_database(options = {}, &block)
    configuration = get_db_configuration_for(options[:as])
    connection = $pool.fetch(configuration) do
      ::Sequel.connect(configuration)
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


  # TODO: delete - superceded by run_pg_query
  def run_query(query)
    rows = []
    time = nil
    in_database do |user_database|
      time = Benchmark.measure {
        rows = user_database[query].all
      }
    end
    #TODO: This part of the code should be using memcache.
    {
      :time => time.real,
      :total_rows => rows.size,
      :rows => rows.map{ |row| row.delete("the_geom"); row }
    }
  rescue => e
    if e.message =~ /^PGError/
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


  def tables
    Table.filter(:user_id => self.id).order(:id).reverse
  end

  # Retrive list of user tables from database catalogue
  #
  # You can use this to check for dangling records in the
  # admin db "user_tables" table.
  #
  # NOTE: this currently returns all public tables, can be
  #       improved to skip "service" tables
  #
  def tables_effective()
    in_database do |user_database|
      user_database.synchronize do |conn|
        query = "select table_name::text from information_schema.tables where table_schema = 'public'"
        tables = user_database[query].all.map { |i| i[:table_name] }
        return tables
      end
    end
  end

  def trial_ends_at
    if account_type.to_s.downcase == 'magellan' && upgraded_at && upgraded_at + 15.days > Date.today
      upgraded_at + 15.days
    else
      nil
    end
  end

  def dedicated_support?
    [/FREE/i, /MAGELLAN/i].select { |rx| self.account_type =~ rx }.empty?
  end

  def remove_logo?
    [/FREE/i, /MAGELLAN/i, /JOHN SNOW/i].select { |rx| self.account_type =~ rx }.empty?
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
      'map_key', api_key
  end

  def get_api_calls(options = {})
    date_to = (options[:to] ? options[:to].to_date : Date.today)
    date_from = (options[:from] ? options[:from].to_date : Date.today - 29.days)
    calls = []
    date_to.downto(date_from) do |date|
      calls << $users_metadata.ZSCORE("user:#{username}:mapviews:global", date.strftime("%Y%m%d")).to_i
    end

    # Add old api calls
    old_calls = get_old_api_calls["per_day"].to_a.reverse rescue []
    calls = calls.zip(old_calls).map { |pair|
      pair[0].to_i + pair[1].to_i
    } unless old_calls.blank?

    return calls
  end

  def get_geocoding_calls(options = {})
    date_to = (options[:to] ? options[:to].to_date : Date.today)
    date_from = (options[:from] ? options[:from].to_date : self.last_billing_cycle)
    Geocoding.where('user_id = ? AND created_at >= ? and created_at <= ?', self.id, date_from, date_to + 1.days)
      .sum(:processed_rows).to_i
  end # get_geocoding_calls

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
    conn = ::Sequel.connect(connection_params)
    conn[:pg_database].filter(:datname => database_name).all.any?
  end
  private :database_exists?

  # This method is innaccurate and understates point based tables (the /2 is to account for the_geom_webmercator)
  #
  # TODO: Without a full table scan, ignoring the_geom_webmercator, we cannot accuratly asses table size
  # Needs to go on a background job.
  def db_size_in_bytes(use_total = false)
    attempts = 0
    begin
      result = in_database(:as => :superuser).fetch("SELECT CDB_UserDataSize()").first[:cdb_userdatasize]
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
    self.account_type.gsub(" ", "_").downcase
    rescue
    ""
  end

  #can be nil table quotas
  def remaining_table_quota
    if self.table_quota.present?
      remaining = self.table_quota - self.table_count
      (remaining < 0) ? 0 : remaining
    end
  end

  def table_count
    Table.filter({:user_id => self.id}).count
  end

  def failed_import_count
    DataImport.where(user_id: self.id, state: 'failure').count
  end

  def success_import_count
    DataImport.where(user_id: self.id, state: 'complete').count
  end
 
  def import_count
    DataImport.where(user_id: self.id).count
  end

  def visualization_count
    maps.count - table_count
  end

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
    update_gauge("visualizations.derived", visualization_count)
  end
  
  def rebuild_quota_trigger
    load_cartodb_functions
    puts "Rebuilding quota trigger in db '#{database_name}' (#{username})"
    tables.all.each do |table|
      begin
        table.set_trigger_check_quota
      rescue Sequel::DatabaseError => e
        next if e.message =~ /.*does not exist\s*/
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

  ## User's databases setup methods
  def setup_user
    return if disabled?

    # Assign database_name
    self.database_name = case Rails.env
      when 'development'
        "cartodb_dev_user_#{self.id}_db"
      when 'staging'
        "cartodb_staging_user_#{self.id}_db"
      when 'test'
        "cartodb_test_user_#{self.id}_db"
      else
        "cartodb_user_#{self.id}_db"
    end
   
    raise "Database #{database_name} already exists" if database_exists?

    self.this.update database_name: self.database_name
    ClientApplication.create(:user_id => self.id)

    Thread.new do
      connection_params = ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        'host' => self.database_host,
        'database' => 'postgres'
      ) {|key, o, n| n.nil? ? o : n}
      conn = ::Sequel.connect(connection_params)
      begin
        conn.run("CREATE USER #{database_username} PASSWORD '#{database_password}'")
      rescue => e
        puts "#{Time.now} USER SETUP ERROR (#{database_username}): #{$!}"
        raise e
      end
      begin
        conn.run("CREATE DATABASE #{self.database_name}
        WITH TEMPLATE = template_postgis
        OWNER = #{::Rails::Sequel.configuration.environment_for(Rails.env)['username']}
        ENCODING = 'UTF8'
        CONNECTION LIMIT=-1")
      rescue => e
        puts "#{Time.now} USER SETUP ERROR WHEN CREATING DATABASE #{self.database_name}: #{$!}"
        raise e
      end
    end.join

    create_schemas_and_set_permissions
    set_database_permissions
    load_cartodb_functions
  end

  def create_schemas_and_set_permissions
    create_schema('cdb')
    create_schema('cdb_importer')
    set_database_permissions_in_schema('cdb')
    set_database_permissions_in_schema('cdb_importer')
  end

  # Attempts to create a new database schema
  # Does not raise exception if the schema already exists
  def create_schema(schema)
    in_database(as: :superuser) do |database|
      database.run(%Q{CREATE SCHEMA #{schema}})
    end
  rescue Sequel::DatabaseError => e
    raise unless e.message =~ /schema .* already exists/
  end #create_schema

  # Add plpythonu pl handler
  def add_python
    in_database(:as => :superuser).run(<<-SQL
      CREATE OR REPLACE PROCEDURAL LANGUAGE 'plpythonu' HANDLER plpython_call_handler;
    SQL
    )
  end

  # Create a "cdb_invalidate_varnish()" function to invalidate Varnish
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
    CREATE OR REPLACE FUNCTION cdb_invalidate_varnish(table_name text) RETURNS void AS
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
                plpy.warning('Varnish connection error: ' +  str(err))
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
            client.fetch('#{purge_command} obj.http.X-Cache-Channel ~ "^#{self.database_name}:(.*%s.*)|(cdb_tablemetadata)|(table)$"' % table_name)
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
    REVOKE ALL ON FUNCTION cdb_invalidate_varnish(TEXT) FROM PUBLIC;
    COMMIT;
TRIGGER
    )
  end

  # Create an "update_timestamp()" trigger function to invalidate Varnish
  # This is currently invoked by the "cache_checkpoint" trigger attached
  # to tables
  #
  # TODO: drop this and replace with a trigger on CDB_TableMetadata
  #
  def create_trigger_function_update_timestamp
    in_database(:as => :superuser).run(<<-TRIGGER
    CREATE OR REPLACE FUNCTION update_timestamp() RETURNS trigger AS
    $$
        table_name = TD["table_name"]
        plan = plpy.prepare("SELECT cdb_invalidate_varnish($1)", ["text"])
        plpy.execute(plan, [table_name])
    $$
    LANGUAGE 'plpythonu' VOLATILE SECURITY DEFINER;
TRIGGER
    )
  end


  # Cartodb functions
  def load_cartodb_functions(files = [])
    create_function_invalidate_varnish
    create_trigger_function_update_timestamp
    in_database(:as => :superuser) do |user_database|
      user_database.transaction do
        if files.empty?
          glob = Rails.root.join('lib/sql/scripts-enabled/*.sql')
          sql_files = Dir.glob(glob).sort
        else
          sql_files = files.map {|sql| Rails.root.join('lib/sql/scripts-enabled', sql).to_s}.sort
        end
        sql_files.each do |f|
          if File.exists?(f)
            CartoDB::Logger.info "Loading CartoDB SQL function #{File.basename(f)} into #{database_name}"
            @sql = File.new(f).read
            @sql.gsub!(':DATABASE_USERNAME', self.database_username)
            user_database.run(@sql)
          else
            CartoDB::Logger.info "SQL function #{File.basename(f)} doesn't exist in lib/sql/scripts-enabled directory. Not loading it."
          end
        end
      end
    end
  end

  def set_statement_timeouts
    in_database(as: :superuser) do |user_database|
      user_database["ALTER ROLE ? SET statement_timeout to ?", database_username.lit, user_timeout].all
      user_database["ALTER DATABASE ? SET statement_timeout to ?", database_name.lit, database_timeout].all
    end
    in_database.disconnect
    in_database.connect(get_db_configuration_for)
    in_database(as: :public_user).disconnect
    in_database(as: :public_user).connect(get_db_configuration_for(:public_user))
  rescue Sequel::DatabaseConnectionError => e
  end

  # Whitelist Permissions
  def set_database_permissions_in_schema(schema)
    in_database(:as => :superuser) do |user_database|
      user_database.transaction do

        # grant core permissions to database user
        user_database.run("GRANT ALL ON SCHEMA #{schema} TO #{database_username}")
        user_database.run("GRANT ALL ON ALL SEQUENCES IN SCHEMA #{schema} TO #{database_username}")
        user_database.run("GRANT ALL ON ALL FUNCTIONS IN SCHEMA #{schema} TO #{database_username}")
        user_database.run("GRANT ALL ON ALL TABLES IN SCHEMA #{schema} TO #{database_username}")

        yield(user_database) if block_given?
      end
    end
  end #set_database_permissions_in_schema

  def set_database_permissions
    in_database(:as => :superuser) do |user_database|
      user_database.transaction do
        schema = 'public'

        # remove all public and tile user permissions
        user_database.run("REVOKE ALL ON DATABASE #{database_name} FROM PUBLIC")
        user_database.run("REVOKE ALL ON SCHEMA #{schema} FROM PUBLIC")
        user_database.run("REVOKE ALL ON ALL SEQUENCES IN SCHEMA #{schema} FROM PUBLIC")
        user_database.run("REVOKE ALL ON ALL FUNCTIONS IN SCHEMA #{schema} FROM PUBLIC")
        user_database.run("REVOKE ALL ON ALL TABLES IN SCHEMA #{schema} FROM PUBLIC")

        user_database.run("REVOKE ALL ON DATABASE #{database_name} FROM #{CartoDB::PUBLIC_DB_USER}")
        user_database.run("REVOKE ALL ON SCHEMA #{schema} FROM #{CartoDB::PUBLIC_DB_USER}")
        user_database.run("REVOKE ALL ON ALL SEQUENCES IN SCHEMA #{schema} FROM #{CartoDB::PUBLIC_DB_USER}")
        user_database.run("REVOKE ALL ON ALL FUNCTIONS IN SCHEMA #{schema} FROM #{CartoDB::PUBLIC_DB_USER}")
        user_database.run("REVOKE ALL ON ALL TABLES IN SCHEMA #{schema} FROM #{CartoDB::PUBLIC_DB_USER}")

        user_database.run("REVOKE ALL ON DATABASE #{database_name} FROM #{CartoDB::TILE_DB_USER}")
        user_database.run("REVOKE ALL ON SCHEMA #{schema} FROM #{CartoDB::TILE_DB_USER}")
        user_database.run("REVOKE ALL ON ALL SEQUENCES IN SCHEMA #{schema} FROM #{CartoDB::TILE_DB_USER}")
        user_database.run("REVOKE ALL ON ALL FUNCTIONS IN SCHEMA #{schema} FROM #{CartoDB::TILE_DB_USER}")
        user_database.run("REVOKE ALL ON ALL TABLES IN SCHEMA #{schema} FROM #{CartoDB::TILE_DB_USER}")

        # grant core permissions to database user
        user_database.run("GRANT ALL ON DATABASE #{database_name} TO #{database_username}")
        user_database.run("GRANT ALL ON SCHEMA #{schema} TO #{database_username}")
        user_database.run("GRANT ALL ON ALL SEQUENCES IN SCHEMA #{schema} TO #{database_username}")
        user_database.run("GRANT ALL ON ALL FUNCTIONS IN SCHEMA #{schema} TO #{database_username}")
        user_database.run("GRANT ALL ON ALL TABLES IN SCHEMA #{schema} TO #{database_username}")

        # grant select permissions to public user (for SQL API)
        user_database.run("GRANT CONNECT ON DATABASE #{database_name} TO #{CartoDB::PUBLIC_DB_USER}")
        user_database.run("GRANT USAGE ON SCHEMA public TO #{CartoDB::PUBLIC_DB_USER}")
        user_database.run("GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO #{CartoDB::PUBLIC_DB_USER}")
        user_database.run("GRANT SELECT ON spatial_ref_sys TO #{CartoDB::PUBLIC_DB_USER}")

        # grant select permissions to tile user (for tile API + internal tiles)
        user_database.run("GRANT CONNECT ON DATABASE #{database_name} TO #{CartoDB::TILE_DB_USER}")
        user_database.run("GRANT USAGE ON SCHEMA public TO #{CartoDB::TILE_DB_USER}")
        user_database.run("GRANT SELECT ON ALL TABLES IN SCHEMA public TO #{CartoDB::TILE_DB_USER}")
        user_database.run("GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO #{CartoDB::TILE_DB_USER}")
        user_database.run("GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO #{CartoDB::TILE_DB_USER}")

        yield(user_database) if block_given?
      end
    end
  end

  # Utility methods
  def fix_permissions
    set_database_permissions do |user_database|
      tables.each do |table|
        user_database.run("ALTER TABLE #{table.name} OWNER TO #{database_username}")
      end
    end
  end

  def monitor_user_notification
    FileUtils.touch(Rails.root.join('log', 'users_modifications'))
  end
end

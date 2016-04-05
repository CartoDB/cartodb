# encoding: UTF-8
require 'cartodb/per_request_sequel_cache'
require_relative './user/user_decorator'
require_relative './user/oauths'
require_relative './synchronization/synchronization_oauth'
require_relative './visualization/member'
require_relative '../helpers/data_services_metrics_helper'
require_relative './visualization/collection'
require_relative './user/user_organization'
require_relative './synchronization/collection.rb'
require_relative '../services/visualization/common_data_service'
require_relative './external_data_import'
require_relative './feature_flag'
require_relative '../../lib/cartodb/stats/api_calls'
require_relative '../../lib/carto/http/client'
require_dependency 'cartodb_config_utils'
require_relative './user/db_service'
require_dependency 'carto/user_db_size_cache'
require_dependency 'cartodb/redis_vizjson_cache'

class User < Sequel::Model
  include CartoDB::MiniSequel
  include CartoDB::UserDecorator
  include Concerns::CartodbCentralSynchronizable
  include CartoDB::ConfigUtils
  include DataServicesMetricsHelper

  self.strict_param_setting = false

  # @param name             String
  # @param avatar_url       String
  # @param database_schema  String
  # @param max_import_file_size Integer
  # @param max_import_table_row_count Integer
  # @param max_concurrent_import_count Integer

  one_to_one  :client_application
  one_to_many :synchronization_oauths
  one_to_many :tokens, :class => :OauthToken
  one_to_many :maps
  one_to_many :assets
  one_to_many :data_imports
  one_to_many :geocodings, order: :created_at.desc
  one_to_many :search_tweets, order: :created_at.desc
  many_to_one :organization

  many_to_many :layers, class: ::Layer, :order => :order, :after_add => proc { |user, layer|
    layer.set_default_order(user)
  }

  one_to_many :feature_flags_user

  plugin :many_through_many
  many_through_many :groups, [[:users_groups, :user_id, :group_id]]

  # Sequel setup & plugins
  plugin :association_dependencies, :client_application => :destroy, :synchronization_oauths => :destroy, :feature_flags_user => :destroy
  plugin :validation_helpers
  plugin :json_serializer
  plugin :dirty
  plugin :caching, PerRequestSequelCache

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


  MIN_PASSWORD_LENGTH = 6
  MAX_PASSWORD_LENGTH = 64

  GEOCODING_BLOCK_SIZE = 1000
  HERE_ISOLINES_BLOCK_SIZE = 1000

  TRIAL_DURATION_DAYS = 15

  DEFAULT_GEOCODING_QUOTA = 0
  DEFAULT_HERE_ISOLINES_QUOTA = 0

  COMMON_DATA_ACTIVE_DAYS = 31

  self.raise_on_typecast_failure = false
  self.raise_on_save_failure = false

  def db_service
    @db_service ||= CartoDB::UserModule::DBService.new(self)
  end

  def self.new_with_organization(organization)
    user = ::User.new
    user.organization = organization
    user.quota_in_bytes = organization.default_quota_in_bytes
    user
  end

  ## Validations
  def validate
    super
    validates_presence :username
    validates_unique   :username
    validates_format /\A[a-z0-9\-]+\z/, :username, message: "must only contain lowercase letters, numbers and the dash (-) symbol"
    validates_format /\A[a-z0-9]{1}/, :username, message: "must start with alphanumeric chars"
    validates_format /[a-z0-9]{1}\z/, :username, message: "must end with alphanumeric chars"
    errors.add(:name, 'is taken') if name_exists_in_organizations?

    validates_presence :email
    validates_unique   :email, :message => 'is already taken'
    validates_format EmailAddressValidator::Regexp::ADDR_SPEC, :email, :message => 'is not a valid address'

    validates_presence :password if new? && (crypted_password.blank? || salt.blank?)

    if new? || (password.present? && !@new_password.present?)
      errors.add(:password, "is not confirmed") unless password == password_confirmation
    end
    validate_password_change

    organization_validation if organization.present?

    errors.add(:geocoding_quota, "cannot be nil") if geocoding_quota.nil?
    errors.add(:here_isolines_quota, "cannot be nil") if here_isolines_quota.nil?
  end

  def organization_validation
    if new?
      organization.validate_for_signup(errors, quota_in_bytes)
      organization.validate_new_user(self, errors)
    elsif quota_in_bytes.to_i + organization.assigned_quota - initial_value(:quota_in_bytes) > organization.quota_in_bytes
      # Organization#assigned_quota includes the OLD quota for this user,
      # so we have to ammend that in the calculation:
      errors.add(:quota_in_bytes, "not enough disk quota")
    end
  end

  #                             +--------+---------+------+
  #       valid_privacy logic   | Public | Private | Link |
  #   +-------------------------+--------+---------+------+
  #   | private_tables_enabled  |    T   |    T    |   T  |
  #   | !private_tables_enabled |    T   |    F    |   F  |
  #   +-------------------------+--------+---------+------+
  #
  def valid_privacy?(privacy)
    self.private_tables_enabled || privacy == UserTable::PRIVACY_PUBLIC
  end

  def valid_password?(key, value, confirmation_value)
    if value.nil?
      errors.add(key, "New password can't be blank")
    else
      if value != confirmation_value
        errors.add(key, "New password doesn't match confirmation")
      end

      if value.length < MIN_PASSWORD_LENGTH
        errors.add(key, "Must be at least #{MIN_PASSWORD_LENGTH} characters long")
      end

      if value.length >= MAX_PASSWORD_LENGTH
        errors.add(key, "Must be at most #{MAX_PASSWORD_LENGTH} characters long")
      end
    end

    errors[key].empty?
  end

  ## Callbacks
  def before_validation
    self.email = self.email.to_s.strip.downcase
    self.geocoding_quota ||= DEFAULT_GEOCODING_QUOTA
    self.here_isolines_quota ||= DEFAULT_HERE_ISOLINES_QUOTA
  end

  def before_create
    super
    self.database_host ||= ::Rails::Sequel.configuration.environment_for(Rails.env)['host']
    self.api_key ||= self.class.make_token
  end

  def before_save
    super
    self.quota_in_bytes = self.quota_in_bytes.to_i if !self.quota_in_bytes.nil? && self.quota_in_bytes != self.quota_in_bytes.to_i
    self.updated_at = Time.now
    # Set account_type and default values for organization users
    # TODO: Abstract this
    self.account_type = "ORGANIZATION USER" if self.organization_user? && !self.organization_owner?
    if self.organization_user?
      if new? || column_changed?(:organization_id)
        self.twitter_datasource_enabled = self.organization.twitter_datasource_enabled
        self.google_maps_key = self.organization.google_maps_key
        self.google_maps_private_key = self.organization.google_maps_private_key
      end
      self.max_layers ||= 6
      self.private_tables_enabled ||= true
      self.private_maps_enabled ||= true
      self.sync_tables_enabled ||= true
    end
  end

  def twitter_datasource_enabled
    if has_organization?
      organization.twitter_datasource_enabled || super
    else
      super
    end
  end

  def after_create
    super
    setup_user
    save_metadata
    self.load_avatar
    db_service.monitor_user_notification
    sleep 1
    db_service.set_statement_timeouts
  end

  def notify_new_organization_user
    ::Resque.enqueue(::Resque::UserJobs::Mail::NewOrganizationUser, self.id)
  end

  def notify_org_seats_limit_reached
    ::Resque.enqueue(::Resque::UserJobs::Mail::NewOrganizationUser, id)
  end

  def should_load_common_data?
    last_common_data_update_date.nil? || last_common_data_update_date < Time.now - COMMON_DATA_ACTIVE_DAYS.day
  end

  def load_common_data(visualizations_api_url)
    CartoDB::Visualization::CommonDataService.new.load_common_data_for_user(self, visualizations_api_url)
  rescue => e
    CartoDB.notify_error(
      "Error loading common data for user",
      user: inspect,
      url: visualizations_api_url,
      error: e.inspect
    )
  end

  def delete_common_data
    CartoDB::Visualization::CommonDataService.new.delete_common_data_for_user(self)
  rescue => e
    CartoDB.notify_error("Error deleting common data for user", user: self, error: e.inspect)
  end

  def after_save
    super
    save_metadata
    changes = (self.previous_changes.present? ? self.previous_changes.keys : [])
    db_service.set_statement_timeouts if changes.include?(:user_timeout) || changes.include?(:database_timeout)
    db_service.rebuild_quota_trigger if changes.include?(:quota_in_bytes)
    if changes.include?(:account_type) || changes.include?(:available_for_hire) || changes.include?(:disqus_shortname) || changes.include?(:email) || \
       changes.include?(:website) || changes.include?(:name) || changes.include?(:description) || \
       changes.include?(:twitter_username) || changes.include?(:location)
      invalidate_varnish_cache(regex: '.*:vizjson')
    end
    if changes.include?(:database_host)
      CartoDB::UserModule::DBService.terminate_database_connections(database_name, previous_changes[:database_host][0])
    elsif changes.include?(:database_schema)
      CartoDB::UserModule::DBService.terminate_database_connections(database_name, database_host)
    end

  end

  def can_delete
    !has_shared_entities?
  end

  def has_shared_entities?
    # Right now, cannot delete users with entities shared with other users or the org.
    has_shared_entities = false
    CartoDB::Permission.where(owner_id: self.id).each { |permission|
      has_shared_entities = has_shared_entities || !permission.acl.empty?
    }
    has_shared_entities
  end

  def before_destroy
    org_id = nil
    @org_id_for_org_wipe = nil
    error_happened = false
    has_organization = false
    unless self.organization.nil?
      self.organization.reload  # Avoid ORM caching
      if self.organization.owner_id == self.id
        @org_id_for_org_wipe = self.organization.id  # after_destroy will wipe the organization too
        if self.organization.users.count > 1
          msg = 'Attempted to delete owner from organization with other users'
          CartoDB::StdoutLogger.info msg
          raise CartoDB::BaseCartoDBError.new(msg)
        end
      end

      unless can_delete
        raise CartoDB::BaseCartoDBError.new('Cannot delete user, has shared entities')
      end

      has_organization = true
    end

    begin
      org_id = self.organization_id
      self.organization_id = nil

      # Remove user tables
      self.tables.all.each { |t| t.destroy }

      # Remove user data imports, maps, layers and assets
      self.delete_external_data_imports
      self.delete_external_sources
      # There's a FK from geocodings to data_import.id so must be deleted in proper order
      if self.organization.nil? || self.organization.owner.nil? || self.id == self.organization.owner.id
        self.geocodings.each { |g| g.destroy }
      else
        assign_geocodings_to_organization_owner
      end
      self.data_imports.each { |d| d.destroy }
      self.maps.each { |m| m.destroy }
      self.layers.each { |l| remove_layer l }
      self.assets.each { |a| a.destroy }
      CartoDB::Synchronization::Collection.new.fetch(user_id: self.id).destroy

      destroy_shared_with

      assign_search_tweets_to_organization_owner
    rescue StandardError => exception
      error_happened = true
      CartoDB::StdoutLogger.info "Error destroying user #{username}. #{exception.message}\n#{exception.backtrace}"
    end

    # Invalidate user cache
    invalidate_varnish_cache

    # Delete the DB or the schema
    if has_organization
      db_service.drop_organization_user(org_id, !@org_id_for_org_wipe.nil?) unless error_happened
    else
      if ::User.where(database_name: database_name).count > 1
        raise CartoDB::BaseCartoDBError.new('The user is not supposed to be in a organization but another user has the same database_name. Not dropping it')
      elsif !error_happened
        Thread.new {
          conn = in_database(as: :cluster_admin)
          db_service.drop_database_and_user(conn)
          db_service.drop_user(conn)
        }.join
        db_service.monitor_user_notification
      end
    end

    # Remove metadata from redis last (to avoid cutting off access to SQL API if db deletion fails)
    $users_metadata.DEL(key) unless error_happened

    feature_flags_user.each(&:delete)
  end

  def delete_external_data_imports
    external_data_imports = ExternalDataImport.by_user_id(self.id)
    external_data_imports.each { |edi| edi.destroy }
  rescue => e
    CartoDB.notify_error('Error deleting external data imports at user deletion', user: self, error: e.inspect)
  end

  def delete_external_sources
    delete_common_data
  rescue => e
    CartoDB.notify_error('Error deleting external data imports at user deletion', user: self, error: e.inspect)
  end

  def after_destroy
    unless @org_id_for_org_wipe.nil?
      organization = Organization.where(id: @org_id_for_org_wipe).first
      organization.destroy
    end
  end

  def invalidate_varnish_cache(options = {})
    options[:regex] ||= '.*'
    CartoDB::Varnish.new.purge("#{database_name}#{options[:regex]}")
  end

  ## Authentication
  AUTH_DIGEST = '47f940ec20a0993b5e9e4310461cc8a6a7fb84e3'

  # allow extra vars for auth
  attr_reader :password

  def validate_password_change
    return if @changing_passwords.nil?  # Called always, validate whenever proceeds

    errors.add(:old_password, "Old password not valid") unless @old_password_validated || !needs_password_confirmation?

    valid_password?(:new_password, @new_password, @new_password_confirmation)
  end

  def change_password(old_password, new_password_value, new_password_confirmation_value)
    # First of all reset fields
    @old_password_validated = nil
    @new_password_confirmation = nil
    # Mark as changing passwords
    @changing_passwords = true

    @new_password = new_password_value
    @new_password_confirmation = new_password_confirmation_value

    @old_password_validated = validate_old_password(old_password)
    return unless @old_password_validated

    return unless valid_password?(:new_password, new_password_value, new_password_confirmation_value)

    # Must be set AFTER validations
    set_last_password_change_date

    self.password = new_password_value
  end

  def validate_old_password(old_password)
    (self.class.password_digest(old_password, self.salt) == self.crypted_password) || (google_sign_in && last_password_change_date.nil?)
  end

  def should_display_old_password?
    self.needs_password_confirmation?
  end

  # Some operations, such as user deletion, won't ask for password confirmation if password is not set (because of Google sign in, for example)
  def needs_password_confirmation?
    (google_sign_in.nil? || !google_sign_in || !last_password_change_date.nil?) && Carto::UserCreation.http_authentication.find_by_user_id(id).nil?
  end

  def password_confirmation
    @password_confirmation
  end

  def password_confirmation=(password_confirmation)
    set_last_password_change_date
    @password_confirmation = password_confirmation
  end

  ##
  # SLOW! Checks redis data (geocodings and isolines) for every user
  # delta: get users who are also this percentage below their limit.
  #        example: 0.20 will get all users at 80% of their map view limit
  #
  def self.overquota(delta = 0)
    ::User.where(enabled: true).all.reject{ |u| u.organization_id.present? }.select do |u|
        limit = u.geocoding_quota.to_i - (u.geocoding_quota.to_i * delta)
        over_geocodings = u.get_geocoding_calls > limit

        limit =  u.twitter_datasource_quota.to_i - (u.twitter_datasource_quota.to_i * delta)
        over_twitter_imports = u.get_twitter_imports_count > limit

        limit = u.here_isolines_quota.to_i - (u.here_isolines_quota.to_i * delta)
        over_here_isolines = u.get_here_isolines_calls > limit

        over_geocodings || over_twitter_imports || over_here_isolines
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
    return if !Carto::Ldap::Manager.new.configuration_present? && !valid_password?(:password, value, value)

    @password = value
    self.salt = new? ? self.class.make_token : ::User.filter(id: id).select(:salt).first.salt
    self.crypted_password = self.class.password_digest(value, salt)
  end

  def self.authenticate(email, password)
    sanitized_input = email.strip.downcase
    if candidate = ::User.filter("email = ? OR username = ?", sanitized_input, sanitized_input).first
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
    (self.database_schema != CartoDB::DEFAULT_DB_SCHEMA) ? "cartodb_publicuser_#{id}" : CartoDB::PUBLIC_DB_USER
  end

  def database_password
    crypted_password + database_username
  end

  def user_database_host
    self.database_host
  end

  def in_database(options = {}, &block)
    if options[:statement_timeout]
      in_database.run("SET statement_timeout TO #{options[:statement_timeout]}")
    end

    configuration = db_service.db_configuration_for(options[:as])
    configuration['database'] = options['database'] unless options['database'].nil?

    begin
      connection = $pool.fetch(configuration) do
        db = get_database(options, configuration)
        db.extension(:connection_validator)
        db.pool.connection_validation_timeout = configuration.fetch('conn_validator_timeout', -1)
        db
      end
    rescue => exception
      CartoDB::report_exception(exception, "Cannot connect to user database",
                                user: self, database: configuration['database'])
      raise exception
    end

    if block_given?
      yield(connection)
    else
      connection
    end

  ensure
    if options[:statement_timeout]
      in_database.run('SET statement_timeout TO DEFAULT')
    end
  end

  # Execute DB code inside a transaction with an optional statement timeout.
  # This is the only way to have the SQL in the block executed with
  # the desired statement_timeout when the connection goes trhough
  # pgbouncer configured with pool mode as 'transaction'.
  def transaction_with_timeout(options)
    statement_timeout = options.delete(:statement_timeout)
    in_database(options) do |db|
      db.transaction do
        begin
          db.run("SET statement_timeout TO #{statement_timeout}") if statement_timeout
          yield db
          db.run('SET statement_timeout TO DEFAULT')
        end
      end
    end
  end

  def connection(options = {})
    configuration = db_service.db_configuration_for(options[:as])

    $pool.fetch(configuration) do
      get_database(options, configuration)
    end
  end

  def get_database(options, configuration)
    ::Sequel.connect(configuration.merge(after_connect: (proc do |conn|
      unless options[:as] == :cluster_admin
        conn.execute(%{ SET search_path TO #{db_service.build_search_path} })
      end
    end)))
  end

  # List all public visualization tags of the user
  def tags(exclude_shared=false, type=CartoDB::Visualization::Member::TYPE_DERIVED)
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
       type: CartoDB::Visualization::Member::TYPE_CANONICAL,
       privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC
    })
  end #map_tags

  def tables
    ::UserTable.filter(:user_id => self.id).order(:id).reverse
  end

  def tables_including_shared
    CartoDB::Visualization::Collection.new.fetch(
        user_id: self.id,
        type: CartoDB::Visualization::Member::TYPE_CANONICAL
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
    request = http_client.request(
      self.gravatar(protocol = 'http://', 128, default_image = '404'),
      method: :get
    )
    response = request.run
    if response.code == 200
      # First try to update the url with the user gravatar
      self.avatar_url = "//#{gravatar_user_url(128)}"
      self.this.update avatar_url: self.avatar_url
    else
      # If the user doesn't have gravatar try to get a cartodb avatar
      if self.avatar_url.nil? || self.avatar_url == "//#{default_avatar}"
        # Only update the avatar if the user avatar is nil or the default image
        self.avatar_url = "#{cartodb_avatar}"
        self.this.update avatar_url: self.avatar_url
      end
    end
  end

  def cartodb_avatar
    if !Cartodb.config[:avatars].nil? &&
       !Cartodb.config[:avatars]['base_url'].nil? && !Cartodb.config[:avatars]['base_url'].empty? &&
       !Cartodb.config[:avatars]['kinds'].nil? && !Cartodb.config[:avatars]['kinds'].empty? &&
       !Cartodb.config[:avatars]['colors'].nil? && !Cartodb.config[:avatars]['colors'].empty?
      avatar_base_url = Cartodb.config[:avatars]['base_url']
      avatar_kind = Cartodb.config[:avatars]['kinds'][Random.new.rand(0..Cartodb.config[:avatars]['kinds'].length - 1)]
      avatar_color = Cartodb.config[:avatars]['colors'][Random.new.rand(0..Cartodb.config[:avatars]['colors'].length - 1)]
      return "#{avatar_base_url}/avatar_#{avatar_kind}_#{avatar_color}.png"
    else
      CartoDB::StdoutLogger.info "Attribute avatars_base_url not found in config. Using default avatar"
      return default_avatar
    end
  end

  def avatar
    self.avatar_url.nil? ? "//#{self.default_avatar}" : self.avatar_url
  end

  def default_avatar
    "/assets/unversioned/images/avatars/public_dashboard_default_avatar.png"
  end

  def gravatar(protocol = "http://", size = 128, default_image = default_avatar)
    "#{protocol}#{self.gravatar_user_url(size)}&d=#{protocol}#{URI.encode(default_image)}"
  end #gravatar

  def gravatar_user_url(size = 128)
    digest = Digest::MD5.hexdigest(email.downcase)
    return "gravatar.com/avatar/#{digest}?s=#{size}"
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
    db_service.tables_effective('public')
  end

  # Gets the list of OAuth accounts the user has (currently only used for synchronization)
  # @return CartoDB::OAuths
  def oauths
    @oauths ||= CartoDB::OAuths.new(self)
  end

  def trial_ends_at
    if account_type.to_s.downcase == 'magellan' && upgraded_at && upgraded_at + TRIAL_DURATION_DAYS.days > Date.today
      upgraded_at + TRIAL_DURATION_DAYS.days
    else
      nil
    end
  end

  def dedicated_support?
    Carto::AccountType.new.dedicated_support?(self)
  end

  def remove_logo?
    Carto::AccountType.new.remove_logo?(self)
  end

  def soft_geocoding_limit?
    Carto::AccountType.new.soft_geocoding_limit?(self)
  end
  alias_method :soft_geocoding_limit, :soft_geocoding_limit?

  def hard_geocoding_limit?
    !self.soft_geocoding_limit?
  end
  alias_method :hard_geocoding_limit, :hard_geocoding_limit?

  def hard_geocoding_limit=(val)
    self[:soft_geocoding_limit] = !val
  end

  def soft_here_isolines_limit?
    Carto::AccountType.new.soft_here_isolines_limit?(self)
  end
  alias_method :soft_here_isolines_limit, :soft_here_isolines_limit?

  def hard_here_isolines_limit?
    !self.soft_here_isolines_limit?
  end
  alias_method :hard_here_isolines_limit, :hard_here_isolines_limit?

  def hard_here_isolines_limit=(val)
    self[:soft_here_isolines_limit] = !val
  end

  def arcgis_datasource_enabled?
    self.arcgis_datasource_enabled == true
  end

  def soft_twitter_datasource_limit?
    self.soft_twitter_datasource_limit  == true
  end

  def hard_twitter_datasource_limit?
    !self.soft_twitter_datasource_limit?
  end
  alias_method :hard_twitter_datasource_limit, :hard_twitter_datasource_limit?

  def hard_twitter_datasource_limit=(val)
    self[:soft_twitter_datasource_limit] = !val
  end

  def private_maps_enabled?
    flag_enabled = self.private_maps_enabled
    return true if flag_enabled.present? && flag_enabled == true

    return true if self.private_tables_enabled # Note private_tables_enabled => private_maps_enabled
    return false
  end

  def viewable_by?(user)
    self.id == user.id || (has_organization? && self.organization.owner.id == user.id)
  end

  def view_dashboard
    self.this.update dashboard_viewed_at: Time.now
    set dashboard_viewed_at: Time.now
  end

  def dashboard_viewed?
    !!dashboard_viewed_at
  end

  def geocoder_type
    google_maps_geocoder_enabled? ? "google" : "heremaps"
  end

  # create the core user_metadata key that is used in redis
  def key
    "rails:users:#{username}"
  end

  # save users basic metadata to redis for other services (node sql api, geocoder api, etc)
  # to use
  def save_metadata
    $users_metadata.HMSET key,
      'id', id,
      'database_name', database_name,
      'database_password', database_password,
      'database_host', database_host,
      'database_publicuser', database_public_username,
      'map_key', api_key,
      'geocoder_type', geocoder_type,
      'geocoding_quota', geocoding_quota,
      'soft_geocoding_limit', soft_geocoding_limit,
      'here_isolines_quota', here_isolines_quota,
      'soft_here_isolines_limit', soft_here_isolines_limit,
      'google_maps_client_id', google_maps_key,
      'google_maps_api_key', google_maps_private_key,
      'period_end_date', period_end_date
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

  # Should return the number of tweets imported by this user for the specified period of time, as an integer
  def get_twitter_imports_count(options = {})
    date_from, date_to = quota_dates(options)
    SearchTweet.get_twitter_imports_count(self.search_tweets_dataset, date_from, date_to)
  end

  # Returns an array representing the last 30 days, populated with api_calls
  # from three different sources
  def get_api_calls(options = {})
    return CartoDB::Stats::APICalls.new.get_api_calls_without_dates(self.username, {old_api_calls: false})
  end

  def get_geocoding_calls(options = {})
    date_from, date_to = quota_dates(options)
    if has_feature_flag?('new_geocoder_quota')
      get_user_geocoding_data(self, date_from, date_to)
    else
      Geocoding.get_geocoding_calls(geocodings_dataset, date_from, date_to)
    end
  end

  def get_new_system_geocoding_calls(options = {})
    date_from, date_to = quota_dates(options)
    get_user_geocoding_data(self, date_from, date_to)
  end

  def get_not_aggregated_geocoding_calls(options = {})
    date_from, date_to = quota_dates(options)
    Geocoding.get_not_aggregated_user_geocoding_calls(geocodings_dataset.db, self.id, date_from, date_to)
  end

  def get_here_isolines_calls(options = {})
    date_from, date_to = quota_dates(options)
    get_user_here_isolines_data(self, date_from, date_to)
  end

  def effective_twitter_block_price
    organization.present? ? organization.twitter_datasource_block_price : self.twitter_datasource_block_price
  end

  def effective_twitter_datasource_block_size
    organization.present? ? organization.twitter_datasource_block_size : self.twitter_datasource_block_size
  end

  def effective_twitter_total_quota
    organization.present? ? organization.twitter_datasource_quota : self.twitter_datasource_quota
  end

  def effective_get_twitter_imports_count
    organization.present? ? organization.get_twitter_imports_count : self.get_twitter_imports_count
  end

  def remaining_geocoding_quota
    if organization.present?
      remaining = organization.remaining_geocoding_quota
    else
      remaining = geocoding_quota - get_geocoding_calls
    end
    (remaining > 0 ? remaining : 0)
  end

  def remaining_here_isolines_quota
    if organization.present?
      remaining = organization.remaining_here_isolines_quota
    else
      remaining = here_isolines_quota - get_here_isolines_calls
    end
    (remaining > 0 ? remaining : 0)
  end

  def remaining_twitter_quota
    if organization.present?
      remaining = organization.remaining_twitter_quota
    else
      remaining = self.twitter_datasource_quota - get_twitter_imports_count
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
    request_body = Cartodb.config[:api_requests_es_service]['body'].dup
    request_url = Cartodb.config[:api_requests_es_service]['url'].dup
    request_body.gsub!("$CDB_SUBDOMAIN$", self.username)
    request_body.gsub!("\"$FROM$\"", from_date)
    request_body.gsub!("\"$TO$\"", to_date)
    request = http_client.request(
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

  ## Legacy stats fetching
  ## This is DEPRECATED
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
    # << operator substract 1 month from the date object
    date = (day > Date.today.day ? Date.today << 1 : Date.today)
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
    ::User.filter(:id => user_id).select(:id,:email,:username,:crypted_password,:database_name,:admin).first
  end


  def enabled?
    self.enabled && self.enable_account_token.nil?
  end

  def disabled?
    !self.enabled
  end

  def database_exists?
    return false if database_name.blank?
    conn = self.in_database(as: :cluster_admin)
    conn[:pg_database].filter(:datname => database_name).all.any?
  end

  def can_change_email?
    return (!self.google_sign_in || self.last_password_change_date.present?) &&
      !Carto::Ldap::Manager.new.configuration_present?
  end

  def can_change_password?
    !Carto::Ldap::Manager.new.configuration_present?
  end

  # This method is innaccurate and understates point based tables (the /2 is to account for the_geom_webmercator)
  # TODO: Without a full table scan, ignoring the_geom_webmercator, we cannot accuratly asses table size
  # Needs to go on a background job.
  def db_size_in_bytes
    return 0 if self.new?

    attempts = 0
    begin
      # Hack to support users without the new MU functiones loaded
      user_data_size_function =
        self.db_service.cartodb_extension_version_pre_mu? ? "CDB_UserDataSize()"
                                                          : "CDB_UserDataSize('#{self.database_schema}')"
      in_database(:as => :superuser).fetch("SELECT cartodb.#{user_data_size_function}").first[:cdb_userdatasize]
    rescue => e
      attempts += 1
      begin
        in_database(:as => :superuser).fetch("ANALYZE")
      rescue => ee
        Rollbar.report_exception(ee)
        raise ee
      end
      retry unless attempts > 1
      CartoDB.notify_exception(e, { user: self })
      # INFO: we need to return something to avoid 'disabled' return value
      nil
    end
  end

  def real_tables(in_schema = database_schema)
    in_database(as: :superuser).select(:pg_class__oid, :pg_class__relname)
                               .from(:pg_class)
                               .join_table(:inner, :pg_namespace, oid: :relnamespace)
                               .where(relkind: 'r', nspname: in_schema)
                               .exclude(relname: ::Table::SYSTEM_TABLE_NAMES)
                               .all
  end

  def exceeded_quota?
    self.over_disk_quota? || self.over_table_quota?
  end

  def remaining_quota(use_total = false, db_size_in_bytes = self.db_size_in_bytes)
    self.quota_in_bytes - db_size_in_bytes
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

  def public_table_count
    table_count({
      privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC,
      exclude_raster: true
    })
  end

  # Only returns owned tables (not shared ones)
  def table_count(filters={})
    filters.merge!(
      type: CartoDB::Visualization::Member::TYPE_CANONICAL,
      exclude_shared: true
    )

    visualization_count(filters)
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

  # Get the count of public visualizations
  def public_visualization_count
    visualization_count({
      type: CartoDB::Visualization::Member::TYPE_DERIVED,
      privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC,
      exclude_shared: true,
      exclude_raster: true
    })
  end

  # Get the count of all visualizations
  def all_visualization_count
    visualization_count({
      type: CartoDB::Visualization::Member::TYPE_DERIVED,
      exclude_shared: false,
      exclude_raster: false
    })
  end

  # Get user owned visualizations
  def owned_visualizations_count
    visualization_count({
      type: CartoDB::Visualization::Member::TYPE_DERIVED,
      exclude_shared: true,
      exclude_raster: false
    })
  end

  # Get a count of visualizations with some optional filters
  def visualization_count(filters = {})
    type_filter           = filters.fetch(:type, nil)
    privacy_filter        = filters.fetch(:privacy, nil)
    exclude_shared_filter = filters.fetch(:exclude_shared, false)
    exclude_raster_filter = filters.fetch(:exclude_raster, false)

    parameters = {
      user_id:        self.id,
      per_page:       CartoDB::Visualization::Collection::ALL_RECORDS,
      exclude_shared: exclude_shared_filter
    }

    parameters.merge!(type: type_filter)      unless type_filter.nil?
    parameters.merge!(privacy: privacy_filter)   unless privacy_filter.nil?
    parameters.merge!(exclude_raster: exclude_raster_filter) if exclude_raster_filter
    CartoDB::Visualization::Collection.new.count_query(parameters)
  end

  def last_visualization_created_at
    Rails::Sequel.connection.fetch("SELECT created_at FROM visualizations WHERE " +
      "map_id IN (select id FROM maps WHERE user_id=?) ORDER BY created_at DESC " +
      "LIMIT 1;", id)
      .to_a.fetch(0, {}).fetch(:created_at, nil)
  end

  def importing_jobs
    imports = DataImport.where(state: ['complete', 'failure']).invert
      .where(user_id: self.id)
      .where { created_at > Time.now - 24.hours }.all
    running_import_ids = Resque::Worker.all.map { |worker| worker.job["payload"]["args"].first["job_id"] rescue nil }.compact
    imports.map do |import|
      # INFO: this timeout is big because huge files might make the import not to be *running*,
      # as well as high load periods. With a smaller timeout modal window displays an error message,
      # and a "0 out of 0 tables imported" mail gets sent
      if import.created_at < Time.now - 60.minutes && !running_import_ids.include?(import.id)
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
    self.organization.present? && self.organization.owner_id == self.id
  end

  def organization_user?
    self.organization.present?
  end

  def belongs_to_organization?(organization)
    organization_user? && organization != nil && self.organization_id == organization.id
  end

  def feature_flags
    @feature_flag_names ||= (self.feature_flags_user.map { |ff| ff.feature_flag.name } + FeatureFlag.where(restricted: false).map { |ff| ff.name }).uniq.sort
  end

  def has_feature_flag?(feature_flag_name)
    self.feature_flags.present? && self.feature_flags.include?(feature_flag_name)
  end

  def reload
    @feature_flag_names = nil
    super
  end

  def create_client_application
    ClientApplication.create(:user_id => self.id)
  end

  ## User's databases setup methods
  def setup_user
    return if disabled?
    db_service.set_database_name

    create_client_application
    if self.has_organization_enabled?
      db_service.new_organization_user_main_db_setup
    else
      if self.has_organization?
        raise "It's not possible to create a user within a inactive organization"
      else
        db_service.new_non_organization_user_main_db_setup
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

  # --- TODO: Extract this to a service object that handles urls

  # Special url that goes to Central if active (for old dashboard only)
  def account_url(request_protocol)
    if CartoDB.account_host
      request_protocol + CartoDB.account_host + CartoDB.account_path + '/' + username
    end
  end

  # Special url that goes to Central if active
  def plan_url(request_protocol)
    account_url(request_protocol) + '/plan'
  end

  # Special url that goes to Central if active
  def upgrade_url(request_protocol)
    cartodb_com_hosted? ? '' : (account_url(request_protocol) + '/upgrade')
  end

  def organization_username
    CartoDB.subdomainless_urls? || organization.nil? ? nil : username
  end

  def subdomain
    if CartoDB.subdomainless_urls?
      username
    else
      organization.nil? ? username : organization.name
    end
  end

  # @return String public user url, which is also the base url for a given user
  def public_url(subdomain_override=nil, protocol_override=nil)
    CartoDB.base_url(subdomain_override.nil? ? subdomain : subdomain_override, organization_username, protocol_override)
  end

  # ----------

  def name_or_username
    name.present? ? name : username
  end

  # Probably not needed with versioning of keys
  # @see RedisVizjsonCache
  # @see EmbedRedisCache
  def purge_redis_vizjson_cache
    vizs = CartoDB::Visualization::Collection.new.fetch(user_id: self.id)
    CartoDB::Visualization::RedisVizjsonCache.new().purge(vizs)
    EmbedRedisCache.new().purge(vizs)
  end

  # returns google maps api key. If the user is in an organization and
  # that organization has api key it's used
  def google_maps_api_key
    if has_organization?
      self.organization.google_maps_key.blank? ? self.google_maps_key : self.organization.google_maps_key
    else
      self.google_maps_key
    end
  end

  # TODO: this is the correct name for what's stored in the model, refactor changing that name
  alias_method :google_maps_query_string, :google_maps_api_key

  # Returns the google maps private key. If the user is in an organization and
  # that organization has a private key, the org's private key is returned.
  def google_maps_private_key
    if has_organization?
      organization.google_maps_private_key || super
    else
      super
    end
  end

  def google_maps_geocoder_enabled?
    google_maps_private_key.present? && google_maps_client_id.present?
  end

  def google_maps_client_id
    Rack::Utils.parse_nested_query(google_maps_query_string)['client'] if google_maps_query_string
  end

  # returnd a list of basemaps enabled for the user
  # when google map key is set it gets the basemaps inside the group "GMaps"
  # if not it get everything else but GMaps in any case GMaps and other groups can work together
  # this may have change in the future but in any case this method provides a way to abstract what
  # basemaps are active for the user
  def basemaps
    basemaps = Cartodb.config[:basemaps]
    if basemaps
      basemaps.select { |group|
        g = group == 'GMaps'
        google_maps_enabled? ? g : !g
      }
    end
  end

  def google_maps_enabled?
    google_maps_query_string.present?
  end

  # return the default basemap based on the default setting. If default attribute is not set, first basemaps is returned
  # it only takes into account basemaps enabled for that user
  def default_basemap
    default = basemaps.find { |group, group_basemaps |
      group_basemaps.find { |b, attr| attr['default'] }
    }
    if default.nil?
      default = basemaps.first[1]
    else
      default = default[1]
    end
    # return only the attributes
    default.first[1]
  end

  def copy_account_features(to)
    to.set_fields(self, [
      :private_tables_enabled, :sync_tables_enabled, :max_layers, :user_timeout,
      :database_timeout, :geocoding_quota, :map_view_quota, :table_quota, :database_host,
      :period_end_date, :map_view_block_price, :geocoding_block_price, :account_type,
      :twitter_datasource_enabled, :soft_twitter_datasource_limit, :twitter_datasource_quota,
      :twitter_datasource_block_price, :twitter_datasource_block_size, :here_isolines_quota,
      :here_isolines_block_price, :soft_here_isolines_limit
    ])
    to.invite_token = ::User.make_token
  end

  def regenerate_api_key
    invalidate_varnish_cache
    update api_key: ::User.make_token
  end

  # This is set temporary on user creation with invitation,
  # or retrieved from database afterwards
  def invitation_token
    @invitation_token ||= get_invitation_token_from_user_creation
  end

  def invitation_token=(invitation_token)
    @invitation_token = invitation_token
  end

  def created_with_invitation?
    user_creation = get_user_creation
    user_creation && user_creation.invitation_token
  end

  private

  def destroy_shared_with
    CartoDB::SharedEntity.where(recipient_id: id).each do |se|
      CartoDB::Permission.where(entity_id: se.entity_id).each do |p|
        p.remove_user_permission(self)
        p.save
      end
    end
  end

  def get_invitation_token_from_user_creation
    user_creation = get_user_creation
    if !user_creation.nil? && user_creation.has_valid_invitation?
      user_creation.invitation_token
    end
  end

  def get_user_creation
    Carto::UserCreation.find_by_user_id(id)
  end

  def quota_dates(options)
    date_to = (options[:to] ? options[:to].to_date : Date.today)
    date_from = (options[:from] ? options[:from].to_date : self.last_billing_cycle)
    return date_from, date_to
  end

  def http_client
    @http_client ||= Carto::Http::Client.get('old_user', log_requests: true)
  end

  # INFO: assigning to owner is necessary because of payment reasons
  def assign_search_tweets_to_organization_owner
    return if self.organization.nil? || self.organization.owner.nil? || self.id == self.organization.owner.id
    self.search_tweets_dataset.each { |st|
      st.user = self.organization.owner
      st.save
    }
  rescue => e
    Rollbar.report_message('Error assigning search tweets to org owner', 'error', { user: self.inspect, error: e.inspect })
  end

  # INFO: assigning to owner is necessary because of payment reasons
  def assign_geocodings_to_organization_owner
    return if self.organization.nil? || self.organization.owner.nil? || self.id == self.organization.owner.id
    self.geocodings.each { |g|
      g.user = self.organization.owner
      g.data_import_id = nil
      g.save
    }
  rescue => e
    Rollbar.report_message('Error assigning geocodings to org owner, fallback to deletion', 'error', { user: self.inspect, error: e.inspect })
    self.geocodings.each { |g| g.destroy }
  end

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

  def set_last_password_change_date
    self.last_password_change_date = Time.zone.now unless new?
  end
end

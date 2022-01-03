require 'cartodb/per_request_sequel_cache'
require 'cartodb-common'
require 'email_address'
require 'securerandom'
require_relative './user/user_decorator'
require_relative './user/oauths'
require_relative './synchronization/synchronization_oauth'
require_relative '../helpers/data_services_metrics_helper'
require_relative './user/user_organization'
require_relative './synchronization/collection.rb'
require_relative '../services/visualization/common_data_service'
require_relative './data_import'
require_relative '../../lib/cartodb/stats/api_calls'
require_relative '../../lib/carto/http/client'
require_dependency 'cartodb_config_utils'
require_relative './user/db_service'
require_dependency 'carto/user_db_size_cache'
require_dependency 'cartodb/redis_vizjson_cache'
require_dependency 'carto/bolt'
require_dependency 'carto/helpers/auth_token_generator'
require_dependency 'carto/user_authenticator'
require_dependency 'carto/email_cleaner'
require_dependency 'carto/email_domain_validator'
require_dependency 'carto/visualization'
require_dependency 'carto/gcloud_user_settings'
require_dependency 'carto/helpers/user_commons'

class User < Sequel::Model
  include CartoDB::MiniSequel
  include CartoDB::UserDecorator
  include CartodbCentralSynchronizable
  include CartoDB::ConfigUtils
  include DataServicesMetricsHelper
  include Carto::AuthTokenGenerator
  include Carto::EmailCleaner
  include Carto::UserCommons

  self.strict_param_setting = false

  # one_to_many :synchronization_oauths
  one_to_many :maps
  one_to_many :assets
  one_to_many :data_imports
  one_to_many :geocodings, order: Sequel.desc(:created_at)

  many_to_many :layers, class: ::Layer, :order => :order, :after_add => proc { |user, layer|
    layer.set_default_order(user)
  }

  plugin :many_through_many

  # Sequel setup & plugins
  # plugin :association_dependencies, synchronization_oauths: :destroy
  plugin :validation_helpers
  plugin :json_serializer
  plugin :dirty
  plugin :caching, PerRequestSequelCache

  # Restrict to_json attributes
  @json_serializer_opts = {
    :except => [ :crypted_password,
                 :session_salt,
                 :invite_token,
                 :invite_token_date,
                 :admin,
                 :enabled,
                 :map_enabled],
    :naked => true # avoid adding json_class to result
  }

  DEFAULT_MAX_LAYERS = 8

  DEFAULT_GEOCODING_QUOTA = 0
  DEFAULT_HERE_ISOLINES_QUOTA = 0
  DEFAULT_MAPZEN_ROUTING_QUOTA = nil

  DEFAULT_MAX_IMPORT_FILE_SIZE = 157286400
  DEFAULT_MAX_IMPORT_TABLE_ROW_COUNT = 500000
  DEFAULT_MAX_CONCURRENT_IMPORT_COUNT = 3

  COMMON_DATA_ACTIVE_DAYS = 31

  self.raise_on_typecast_failure = false
  self.raise_on_save_failure = false

  ## AR compatibility until User is migrated
  def organization
    Carto::Organization.find_by(id: organization_id) if organization_id
  end

  def organization=(organization)
    self.organization_id = organization&.id
  end

  def carto_user
    user_object = persisted? ? Carto::User.find_by(id: id) : Carto::User.new(attributes)
    user_object.factory_bot_context = factory_bot_context if user_object
    user_object
  end

  def sequel_user
    self
  end

  def self_feature_flags_user
    Carto::FeatureFlagsUser.where(user_id: id)
  end

  def self_feature_flags
    Carto::FeatureFlag.where(id: self_feature_flags_user.pluck(:feature_flag_id))
  end

  delegate :groups, to: :carto_user
  ## ./AR compatibility until User is migrated

  def db_service
    @db_service ||= CartoDB::UserModule::DBService.new(self)
  end

  def self.new_with_organization(organization, viewer: false)
    user = ::User.new
    user.organization = organization
    user.quota_in_bytes = viewer ? 0 : organization.default_quota_in_bytes
    user.viewer = viewer
    user
  end

  ## Validations
  def validate
    super
    validate_username
    validate_email
    validate_password
    validate_organization
    validate_quotas
  end

  def validate_username
    validates_presence :username
    validates_unique   :username
    validates_format /\A[a-z0-9\-]+\z/, :username, message: "must only contain lowercase letters, numbers and the dash (-) symbol"
    validates_format /\A[a-z0-9]{1}/, :username, message: "must start with alphanumeric chars"
    validates_format /[a-z0-9]{1}\z/, :username, message: "must end with alphanumeric chars"
    validates_max_length 63, :username
    errors.add(:name, 'is taken') if Carto::Organization.exists?(name: username)
  end

  def validate_email
    return unless new? || column_changed?(:email)

    validates_presence :email
    validates_unique   :email, message: 'is already taken'
    errors.add(:email, EmailAddress.error(email)) unless EmailAddress.valid?(email)
  end

  def validate_password
    validates_presence :password if new? && crypted_password.blank?

    if new? || (password.present? && !@new_password.present?)
      errors.add(:password, "is not confirmed") unless password == password_confirmation
    end
    validate_password_change
  end

  def validate_organization
    if organization.present?
      organization_validation
    elsif org_admin
      errors.add(:org_admin, "cannot be set for non-organization user")
    end
  end

  def validate_quotas
    errors.add(:geocoding_quota, "cannot be nil") if geocoding_quota.nil?
    errors.add(:here_isolines_quota, "cannot be nil") if here_isolines_quota.nil?
  end

  def organization_validation
    if new?
      organization.validate_for_signup(errors, self)

      unless valid_email_domain?(email)
        errors.add(:email, "The domain of '#{email}' is not valid for #{organization.name} organization")
      end
    else
      if quota_in_bytes.to_i + organization.assigned_quota - initial_value(:quota_in_bytes) > organization.quota_in_bytes
        # Organization#assigned_quota includes the OLD quota for this user,
        # so we have to ammend that in the calculation:
        errors.add(:quota_in_bytes, "not enough disk quota")
      end

      organization.validate_seats_for_signup(self, errors)
    end

    errors.add(:viewer, "cannot be enabled for organization admin") if organization_admin? && viewer
  end

  def valid_creation?(creator_user)
    if organization_admin? && !creator_user.organization_owner?
      errors.add(:org_admin, 'can only be set by organization owner')
      false
    else
      valid?
    end
  end

  def valid_update?(updater_user)
    if column_changed?(:org_admin) && !updater_user.organization_owner?
      errors.add(:org_admin, 'can only be set by organization owner')
      false
    else
      valid?
    end
  end

  ## Callbacks
  def before_validation
    self.email = clean_email(email.to_s)
    self.geocoding_quota ||= DEFAULT_GEOCODING_QUOTA
    self.here_isolines_quota ||= DEFAULT_HERE_ISOLINES_QUOTA
    self.mapzen_routing_quota ||= DEFAULT_MAPZEN_ROUTING_QUOTA
    self.soft_geocoding_limit = false if soft_geocoding_limit.nil?
    self.viewer = false if viewer.nil?
    self.org_admin = false if org_admin.nil?
    true
  end

  def before_create
    super
    self.database_host ||= ::SequelRails.configuration.environment_for(Rails.env)['host']
    self.api_key ||= make_token
    self.session_salt ||= SecureRandom.hex
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
        self.twitter_datasource_enabled = organization.twitter_datasource_enabled
        self.google_maps_key = organization.google_maps_key
        self.google_maps_private_key = organization.google_maps_private_key

        if !organization_owner?
          self.max_import_file_size ||= organization.max_import_file_size
          self.max_import_table_row_count ||= organization.max_import_table_row_count
          self.max_concurrent_import_count ||= organization.max_concurrent_import_count
          self.max_layers ||= organization.max_layers

          # Non-owner org users get the free SDK plan
          if organization.owner && organization.owner.mobile_sdk_enabled?
            self.mobile_max_open_users = 10000 unless changed_columns.include?(:mobile_max_open_users)
            self.mobile_max_private_users = 10 unless changed_columns.include?(:mobile_max_private_users)
            self.mobile_xamarin = true unless changed_columns.include?(:mobile_xamarin)
            self.mobile_gis_extension = true unless changed_columns.include?(:mobile_gis_extension)
            self.mobile_custom_watermark = false unless changed_columns.include?(:mobile_custom_watermark)
            self.mobile_offline_maps = false unless changed_columns.include?(:mobile_offline_maps)
          end
        end
      end
      self.max_layers ||= DEFAULT_MAX_LAYERS
      self.private_tables_enabled ||= true
      self.private_maps_enabled ||= true
      self.sync_tables_enabled ||= true

      # Make the default of new organization users nil (inherit from organization) instead of the DB default
      # but only if not explicitly set otherwise
      self.builder_enabled = nil if new? && !changed_columns.include?(:builder_enabled)
      self.engine_enabled = nil if new? && !changed_columns.include?(:engine_enabled)
    end

    if viewer
      # Enforce quotas
      set_viewer_quotas
      if !new? && column_changed?(:viewer)
        revoke_rw_permission_on_shared_entities
      end
    end
  end

  def twitter_datasource_enabled
    (super || organization.try(&:twitter_datasource_enabled)) && twitter_configured?
  end

  def after_create
    super
    setup_user

    unless factory_bot_context && factory_bot_context[:only_db_setup]
      save_metadata
      load_avatar
    end

    db.after_commit { create_api_keys }

    unless factory_bot_context && factory_bot_context[:only_db_setup]
      db_service.monitor_user_notification
      sleep 1
      db_service.set_statement_timeouts
    end
  end

  def notify_new_organization_user
    ::Resque.enqueue(::Resque::UserJobs::Mail::NewOrganizationUser, self.id)
  end

  def notify_org_seats_limit_reached
    ::Resque.enqueue(::Resque::UserJobs::Mail::NewOrganizationUser, id)
  end

  def should_load_common_data?
    builder? && common_data_outdated?
  end

  def load_common_data(visualizations_api_url)
    CartoDB::Visualization::CommonDataService.new.load_common_data_for_user(self, visualizations_api_url)
  rescue StandardError => e
    CartoDB.notify_error(
      "Error loading common data for user",
      user: inspect,
      url: visualizations_api_url,
      error: e.inspect
    )
  end

  def delete_common_data
    CartoDB::Visualization::CommonDataService.new.delete_common_data_for_user(self)
  rescue StandardError => e
    Rails.logger.error(message: 'Error deleting common data for user', user: self, exception: e)
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
    if changes.include?(:database_schema)
      CartoDB::UserModule::DBService.terminate_database_connections(database_name, database_host)
    end

    # API keys management
    sync_master_key if changes.include?(:api_key)
    sync_default_public_key if changes.include?(:database_schema)
    $users_metadata.HSET(key, 'map_key', make_token) if locked?
    db.after_commit { sync_enabled_api_keys } if changes.include?(:engine_enabled) || changes.include?(:state)

    if changes.include?(:org_admin) && !organization_owner?
      org_admin ? db_service.grant_admin_permissions : db_service.revoke_admin_permissions
    end

    reset_password_rate_limit if changes.include?(:crypted_password)
  end

  def api_keys
    Carto::ApiKey.where(user_id: id)
  end

  def user_multifactor_auths
    Carto::UserMultifactorAuth.where(user_id: id)
  end

  def set_force_destroy
    @force_destroy = true
  end

  def before_destroy(skip_table_drop: false)
    ensure_nonviewer

    @org_id_for_org_wipe = nil
    error_happened = false
    has_organization = false

    if organization.present?
      organization.reload # Avoid ORM caching

      if organization.owner_id == id
        @org_id_for_org_wipe = organization.id # after_destroy will wipe the organization too

        if organization.users.count > 1
          msg = 'Attempted to delete owner from organization with other users'
          log_info(message: msg)
          raise CartoDB::BaseCartoDBError.new(msg)
        end
      end

      if !@force_destroy && has_shared_entities?
        raise CartoDB::SharedEntitiesError.new('Cannot delete user, has shared entities')
      end

      has_organization = true
    end

    begin
      # Remove user data imports, maps, layers and assets
      ActiveRecord::Base.transaction do
        delete_external_data_imports
        delete_external_sources
        Carto::VisualizationQueryBuilder.new.with_user_id(id).build.all.map(&:destroy_without_checking_permissions!)
        oauth_app_user = Carto::OauthAppUser.where(user_id: id).first
        oauth_app_user.oauth_access_tokens.each(&:destroy) if oauth_app_user
        Carto::ApiKey.where(user_id: id).each(&:destroy)
      end

      # This shouldn't be needed, because previous step deletes canonical visualizations.
      # Kept in order to support old data.
      tables.all.each(&:destroy)

      # There's a FK from geocodings to data_import.id so must be deleted in proper order
      if organization.nil? || organization.owner.nil? || id == organization.owner.id
        geocodings.each(&:destroy)
      else
        assign_geocodings_to_organization_owner
      end
      data_imports.each(&:destroy)
      maps.each(&:destroy)
      layers.each do |l|
        remove_layer(l)
        l.destroy
      end
      assets.each(&:destroy)
      # This shouldn't be needed, because previous step deletes canonical visualizations.
      # Kept in order to support old data.
      CartoDB::Synchronization::Collection.new.fetch(user_id: id).destroy

      destroy_shared_with

      assign_search_tweets_to_organization_owner

      Carto::ClientApplication.where(user_id: id).destroy_all
    rescue StandardError => exception
      error_happened = true
      log_error(message: 'Error destroying user', current_user: self, exception: exception)
    end

    # Invalidate user cache
    invalidate_varnish_cache

    drop_database(has_organization) unless skip_table_drop || error_happened

    # Remove metadata from redis last (to avoid cutting off access to SQL API if db deletion fails)
    unless error_happened
      $users_metadata.DEL(key)
      $users_metadata.DEL(timeout_key)
    end

    self_feature_flags_user.each(&:destroy)
  end

  def drop_database(has_organization)
    if has_organization
      db_service.drop_organization_user(
        organization_id,
        is_owner: !@org_id_for_org_wipe.nil?,
        force_destroy: @force_destroy
      )
    elsif ::User.where(database_name: database_name).count > 1
      raise CartoDB::BaseCartoDBError.new(
        'The user is not supposed to be in a organization but another user has the same database_name. Not dropping it')
    else
      Thread.new {
        conn = in_database(as: :cluster_admin)
        db_service.drop_database_and_user(conn)
        db_service.drop_user(conn)
      }.join
      db_service.monitor_user_notification
    end
  end

  def delete_external_data_imports
    Carto::ExternalDataImport.by_user_id(id).each(&:destroy)
  rescue StandardError => e
    CartoDB.notify_error('Error deleting external data imports at user deletion', user: self, error: e.inspect)
  end

  def delete_external_sources
    delete_common_data
  rescue StandardError => e
    CartoDB.notify_error('Error deleting external data imports at user deletion', user: self, error: e.inspect)
  end

  def after_destroy
    unless @org_id_for_org_wipe.nil?
      organization = Carto::Organization.find_by(id: @org_id_for_org_wipe)
      organization.destroy
    end

    # we need to wait for the deletion to be commited because of the mix of Sequel (user)
    # and AR (rate_limit) models and rate_limit_id being a FK in the users table
    db.after_commit do
      begin
        rate_limit.try(:destroy_completely, self)
      rescue StandardError => e
        log_error(message: 'Error deleting rate limit at user deletion', exception: e)
      end
    end
  end

  # allow extra vars for auth
  attr_reader :password
  attr_accessor :factory_bot_context

  def created_via=(created_via)
    @created_via = created_via
  end

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
    return unless validate_password_not_in_use(old_password, @new_password)

    self.password = new_password_value
  end

  def password_in_use?(old_password = nil, new_password = nil)
    return false if new? || (@changing_passwords && !old_password)
    return old_password == new_password if old_password

    old_crypted_password = carto_user.crypted_password_was
    Carto::Common::EncryptionService.verify(password: new_password, secure_password: old_crypted_password,
                                            secret: Cartodb.config[:password_secret])
  end

  def should_display_old_password?
    needs_password_confirmation?
  end

  alias :password_set? :needs_password_confirmation?

  def password_confirmation
    @password_confirmation
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
    Carto::Common::EncryptionService.hex_digest(crypted_password) + database_username
  end

  def user_database_host
    self.database_host
  end

  # Obtain a db connection through the default port. Allows to set a statement_timeout
  # which is only effective in case the connection does not use PGBouncer or any other
  # PostgreSQL transaction-level connection pool which might not persist connection variables.
  def in_database(options = {}, &block)
    if options[:statement_timeout]
      in_database.run("SET statement_timeout TO #{options[:statement_timeout]}")
    end

    configuration = db_service.db_configuration_for(options[:as])
    configuration['database'] = options['database'] unless options['database'].nil?

    connection = get_connection(options, configuration)

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

  def get_connection(options = {}, configuration)
  connection = $pool.fetch(configuration) do
      db = get_database(options, configuration)
      db.extension(:connection_validator)
      db.pool.connection_validation_timeout = configuration.fetch('conn_validator_timeout', -1)
      db
    end
  rescue StandardError => exception
    CartoDB::report_exception(exception, "Cannot connect to user database",
                              user: self, database: configuration['database'])
    raise exception
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

  def tables
    ::UserTable.filter(:user_id => self.id).order(:id).reverse
  end

  def load_avatar
    if self.avatar_url.nil?
      self.reload_avatar
    end
  end

  def reload_avatar
    if gravatar_enabled?
      request = http_client.request(
        gravatar('http://', 128, '404'),
        method: :get
      )
      response = request.run
      if response.code == 200
        # First try to update the url with the user gravatar
        self.avatar_url = "//#{gravatar_user_url(128)}"
        this.update avatar_url: avatar_url
      end
    end

    # If the user doesn't have gravatar try to get a cartodb avatar
    if avatar_url.nil? || avatar_url == "//#{default_avatar}"
      # Only update the avatar if the user avatar is nil or the default image
      self.avatar_url = cartodb_avatar.to_s
      this.update avatar_url: avatar_url
    end
  end

  def cartodb_avatar
    avatar_base_url = Cartodb.get_config(:avatars, 'base_url')
    kinds = Cartodb.get_config(:avatars, 'kinds')
    colors = Cartodb.get_config(:avatars, 'colors')
    if avatar_base_url && kinds && colors
      avatar_kind = kinds.sample
      avatar_color = colors.sample
      return "#{avatar_base_url}/avatar_#{avatar_kind}_#{avatar_color}.png"
    else
      log_info(message: "Attribute avatars_base_url not found in config. Using default avatar")
      return default_avatar
    end
  end

  def default_avatar
    "/assets/unversioned/images/avatars/public_dashboard_default_avatar.png"
  end

  def gravatar_enabled?
    # Enabled by default, only disabled if specified in the config
    value = Cartodb.config[:avatars] && Cartodb.config[:avatars]['gravatar_enabled']
    value.to_s != 'false'
  end

  def gravatar(protocol = "http://", size = 128, default_image = default_avatar)
    "#{protocol}#{gravatar_user_url(size)}&d=#{protocol}#{URI.encode(default_image)}"
  end # gravatar

  def gravatar_user_url(size = 128)
    digest = Digest::MD5.hexdigest(email.downcase)
    "gravatar.com/avatar/#{digest}?s=#{size}"
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

  def hard_geocoding_limit=(val)
    self[:soft_geocoding_limit] = !val
  end

  def hard_here_isolines_limit=(val)
    self[:soft_here_isolines_limit] = !val
  end

  def hard_twitter_datasource_limit=(val)
    self[:soft_twitter_datasource_limit] = !val
  end

  def hard_mapzen_routing_limit=(val)
    self[:soft_mapzen_routing_limit] = !val
  end

  def private_maps_enabled?
    !!private_maps_enabled
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

  # save users basic metadata to redis for other services (node sql api, geocoder api, etc)
  # to use
  def save_metadata
    $users_metadata.HMSET key,
                          'id',                        id,
                          'database_name',             database_name,
                          'database_password',         database_password,
                          'database_host',             database_host,
                          'database_publicuser',       database_public_username,
                          'map_key',                   api_key,
                          'geocoder_type',             geocoder_type,
                          'geocoding_quota',           geocoding_quota,
                          'soft_geocoding_limit',      soft_geocoding_limit,
                          'here_isolines_quota',       here_isolines_quota,
                          'soft_here_isolines_limit',  soft_here_isolines_limit,
                          'mapzen_routing_quota',      mapzen_routing_quota,
                          'soft_mapzen_routing_limit', soft_mapzen_routing_limit,
                          'google_maps_client_id',     google_maps_key,
                          'google_maps_api_key',       google_maps_private_key,
                          'period_end_date',           period_end_date,
                          'geocoder_provider',         geocoder_provider,
                          'isolines_provider',         isolines_provider,
                          'routing_provider',          routing_provider
    $users_metadata.HMSET timeout_key,
                          'db',                        user_timeout,
                          'db_public',                 database_timeout,
                          'render',                    user_render_timeout,
                          'render_public',             database_render_timeout,
                          'export',                    export_timeout
    save_rate_limits
  end

  def save_rate_limits
    effective_rate_limit.save_to_redis(self)
  rescue StandardError => e
    log_error(message: 'Error saving rate limits to redis', target_user: self, exception: e)
  end

  def update_rate_limits(rate_limit_attributes)
    if rate_limit_attributes.present?
      rate_limit = self.rate_limit || Carto::RateLimit.new
      new_attributes = Carto::RateLimit.from_api_attributes(rate_limit_attributes).rate_limit_attributes

      rate_limit.update_attributes!(new_attributes)
      self.rate_limit_id = rate_limit.id
    else
      remove_rate_limit = self.rate_limit
      self.rate_limit_id = nil
    end

    save

    remove_rate_limit.destroy if remove_rate_limit.present?
  end

  def effective_rate_limit
    rate_limit || effective_account_type.rate_limit
  rescue ActiveRecord::RecordNotFound => e
    log_error(message: 'Error retrieving user rate limits', target_user: self, exception: e)
  end

  def effective_account_type
    organization_user? && organization.owner ? organization.owner.carto_account_type : carto_account_type
  end

  def rate_limit
    Carto::RateLimit.find(rate_limit_id) if rate_limit_id
  end

  # Returns an array representing the last 30 days, populated with api_calls
  # from three different sources
  def get_api_calls(options = {})
    return CartoDB::Stats::APICalls.new.get_api_calls_without_dates(self.username, {old_api_calls: false})
  end

  def get_geocoding_calls(options = {})
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

  def get_mapzen_routing_calls(options = {})
    date_from, date_to = quota_dates(options)
    get_user_mapzen_routing_data(self, date_from, date_to)
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

  def remaining_mapzen_routing_quota
    if organization.present?
      remaining = organization.remaining_mapzen_routing_quota
    else
      remaining = mapzen_routing_quota.to_i - get_mapzen_routing_calls
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

  def set_last_active_time
    $users_metadata.HMSET key, 'last_active_time', Time.now
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
      in_database(as: :superuser) do |user_database|
        user_database.transaction do
          user_database.fetch(%{SET LOCAL lock_timeout = '1s'})
          user_database.fetch(%{SELECT cartodb.#{user_data_size_function}}).first[:cdb_userdatasize]
        end
      end
    rescue StandardError => e
      attempts += 1
      begin
        in_database(:as => :superuser).fetch("ANALYZE")
      rescue StandardError => ee
        log_error(exception: ee, current_user: self)
        raise ee
      end
      retry unless attempts > 1
      CartoDB.notify_exception(e, { user: self })
      # INFO: we need to return something to avoid 'disabled' return value
      nil
    end
  end

  def real_tables(in_schema=self.database_schema)
    self.in_database(:as => :superuser)
        .select(:pg_class__oid, :pg_class__relname)
        .from(:pg_class)
        .join_table(:inner, :pg_namespace, :oid => :relnamespace)
        .where(:relkind => 'r', :nspname => in_schema)
        .exclude(:relname => Carto::DB::Sanitize::SYSTEM_TABLE_NAMES)
        .all
  end

  def exceeded_quota?
    self.over_disk_quota? || self.over_table_quota?
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
    rescue StandardError
    ''
  end

  def public_table_count
    table_count(privacy: Carto::Visualization::PRIVACY_PUBLIC, exclude_raster: true)
  end

  # Only returns owned tables (not shared ones)
  def table_count(filters={})
    filters.merge!(
      type: Carto::Visualization::TYPE_CANONICAL,
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
    visualization_count(
      type: Carto::Visualization::MAP_TYPES,
      privacy: Carto::Visualization::PRIVACY_PUBLIC,
      exclude_shared: true,
      exclude_raster: true
    )
  end

  def public_privacy_visualization_count
    public_visualization_count
  end

  def public_privacy_dataset_count
    visualization_count(
      type: Carto::Visualization::TYPE_CANONICAL,
      privacy: Carto::Visualization::PRIVACY_PUBLIC,
      exclude_shared: true,
      exclude_raster: true
    )
  end

  def link_privacy_visualization_count
    visualization_count(type: Carto::Visualization::MAP_TYPES,
                        privacy: Carto::Visualization::PRIVACY_LINK,
                        exclude_shared: true,
                        exclude_raster: true)
  end

  def password_privacy_visualization_count
    visualization_count(type: Carto::Visualization::MAP_TYPES,
                        privacy: Carto::Visualization::PRIVACY_PROTECTED,
                        exclude_shared: true,
                        exclude_raster: true)
  end

  def private_privacy_visualization_count
    visualization_count(type: Carto::Visualization::MAP_TYPES,
                        privacy: Carto::Visualization::PRIVACY_PRIVATE,
                        exclude_shared: true,
                        exclude_raster: true)
  end

  # Get the count of all visualizations
  def all_visualization_count
    visualization_count({
                          type: Carto::Visualization::MAP_TYPES,
                          exclude_shared: false,
                          exclude_raster: false
                        })
  end

  # Get user owned visualizations
  def owned_visualizations_count
    visualization_count({
                          type: Carto::Visualization::MAP_TYPES,
                          exclude_shared: true,
                          exclude_raster: false
                        })
  end

  # Get a count of visualizations with some optional filters
  def visualization_count(filters = {})
    return 0 unless id

    vqb = Carto::VisualizationQueryBuilder.new
    vqb.with_type(filters[:type]) if filters[:type]
    vqb.with_privacy(filters[:privacy]) if filters[:privacy]
    if filters[:exclude_shared] == true
      vqb.with_user_id(id)
    else
      vqb.with_owned_by_or_shared_with_user_id(id)
    end
    vqb.without_raster if filters[:exclude_raster] == true
    vqb.count
  end

  def last_visualization_created_at
    SequelRails.connection.fetch("SELECT created_at FROM visualizations WHERE " +
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

  def client_application
    Carto::ClientApplication.find_by(user_id: id)
  end

  ## User's databases setup methods
  def setup_user
    return if disabled?
    db_service.set_database_name

    new_client_application
    if self.has_organization_enabled?
      db_service.new_organization_user_main_db_setup
    else
      if self.has_organization?
        raise "It's not possible to create a user within a inactive organization"
      else
        db_service.new_non_organization_user_main_db_setup
      end
    end
    setup_aggregation_tables
  end

  # Probably not needed with versioning of keys
  # @see RedisVizjsonCache
  # @see EmbedRedisCache
  def purge_redis_vizjson_cache
    vizs = Carto::VisualizationQueryBuilder.new.with_user_id(id).build.all
    CartoDB::Visualization::RedisVizjsonCache.new().purge(vizs)
    EmbedRedisCache.new().purge(vizs)
  end

  def google_maps_private_key
    organization.try(:google_maps_private_key).blank? ? super : organization.google_maps_private_key
  end

  # return the default basemap based on the default setting. If default attribute is not set, first basemaps is returned
  # it only takes into account basemaps enabled for that user
  def default_basemap
    default = google_maps_enabled? && basemaps['GMaps'].present? ? basemaps.slice('GMaps') : basemaps
    Cartodb.default_basemap(default)
  end

  def copy_account_features(to)
    attributes_to_copy = %i(
      private_tables_enabled sync_tables_enabled max_layers user_timeout database_timeout geocoding_quota
      map_views_quota
      table_quota public_map_quota regular_api_key_quota database_host period_end_date map_view_block_price
      geocoding_block_price account_type twitter_datasource_enabled soft_twitter_datasource_limit
      twitter_datasource_quota twitter_datasource_block_price twitter_datasource_block_size here_isolines_quota
      here_isolines_block_price soft_here_isolines_limit private_map_quota public_dataset_quota
    )
    to.set_fields(self, attributes_to_copy)
    to.invite_token = make_token
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
    user_creation&.invitation_token
  end

  def destroy_cascade
    set_force_destroy
    destroy
  end

  # Central will request some data back to cartodb (quotas, for example), so the user still needs to exist.
  # Corollary: multithreading is needed for deletion to work.
  def destroy_account
    delete_in_central
    destroy
  end

  def create_api_keys
    carto_user.api_keys.create_master_key! unless carto_user.api_keys.master.exists?
    carto_user.api_keys.create_default_public_key! unless carto_user.api_keys.default_public.exists?
  end

  # TODO: migrate to AR association
  def tokens
    Carto::OauthToken.where(user_id: id)
  end

  def search_tweets
    Carto::SearchTweet.where(user_id: id).order(created_at: :desc)
  end

  private

  def common_data_outdated?
    last_common_data_update_date.nil? || last_common_data_update_date < Time.now - COMMON_DATA_ACTIVE_DAYS.day
  end

  def destroy_shared_with
    Carto::SharedEntity.where(recipient_id: id).find_each do |se|
      viz = Carto::Visualization.find(se.entity_id)
      permission = viz.permission
      permission.remove_user_permission(self)
      permission.save
    end
  end

  def get_invitation_token_from_user_creation
    user_creation.invitation_token if user_creation&.has_valid_invitation?
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
    return if organization.nil? || organization.owner.nil? || organization_owner?
    search_tweets.each { |st| st.update!(user: Carto::User.find(organization.owner.id)) }
  rescue StandardError => e
    log_error(exception: e, message: 'Error assigning search tweets to org owner', target_user: self)
  end

  # INFO: assigning to owner is necessary because of payment reasons
  def assign_geocodings_to_organization_owner
    return if organization&.owner.blank? || organization_owner?

    Carto::Geocoding.where(user_id: id).find_each do |geocoding|
      geocoding.update!(user_id: organization.owner.id, data_import_id: nil)
    end
  rescue StandardError => e
    log_error(
      message: 'Error assigning geocodings to org owner',
      exception: e,
      target_user: self,
      organization: organization
    )
    geocodings.each(&:destroy)
  end

  def set_viewer_quotas
    self.quota_in_bytes = 0 unless quota_in_bytes == 0
    self.geocoding_quota = 0 unless geocoding_quota == 0
    self.soft_geocoding_limit = false if soft_geocoding_limit
    self.twitter_datasource_quota = 0 unless twitter_datasource_quota == 0
    self.soft_twitter_datasource_limit = false if soft_twitter_datasource_limit
    self.here_isolines_quota = 0 unless here_isolines_quota == 0
    self.soft_here_isolines_limit = false if soft_here_isolines_limit
  end

  def revoke_rw_permission_on_shared_entities
    rw_permissions = visualizations_shared_with_this_user
                     .map(&:permission)
                     .select { |p| p.permission_for_user(self) == Carto::Permission::ACCESS_READWRITE }

    rw_permissions.each do |p|
      p.remove_user_permission(self)
      p.set_user_permission(self, Carto::Permission::ACCESS_READONLY)
    end
    rw_permissions.map(&:save)
  end

  def visualizations_shared_with_this_user
    Carto::VisualizationQueryBuilder.new.with_shared_with_user_id(id).build.all
  end

  def setup_aggregation_tables
    if Cartodb.get_config(:aggregation_tables).present?
      db_service.connect_to_aggregation_tables
    end
  end

  def valid_email_domain?(email)
    if created_via == Carto::UserCreation::CREATED_VIA_API || # Overrides domain check for owner actions
       organization.try(:whitelisted_email_domains).try(:blank?) ||
       invitation_token.present? # Overrides domain check for users (invited by owners)
      return true
    end

    Carto::EmailDomainValidator.validate_domain(email, organization.whitelisted_email_domains)
  end

  def sync_master_key
    master_key = api_keys.master.first
    return unless master_key

    # Workaround: User save is not yet commited, so AR doesn't see the new api_key
    master_key.user.api_key = api_key
    master_key.update_attributes(token: api_key)
  end

  def sync_default_public_key
    default_key = api_keys.default_public.first
    return unless default_key

    # Workaround: User save is not yet commited, so AR doesn't see the new database_schema
    default_key.user.database_schema = database_schema
    default_key.update_attributes(db_role: database_public_username)
  end

  def sync_enabled_api_keys
    if previous_changes.present?
      new_attributes = {}
      new_attributes[:state] = previous_changes[:state][1] if previous_changes[:state].present?
      new_attributes[:engine_enabled] = previous_changes[:engine_enabled][1] if previous_changes[:engine_enabled].present?
    end

    api_keys.each { |api_key| api_key.set_enabled_for_engine(new_attributes) }
  end
end

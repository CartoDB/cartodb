# encoding: UTF-8
require 'cartodb/per_request_sequel_cache'
require_relative './user/user_decorator'
require_relative './user/oauths'
require_relative './synchronization/synchronization_oauth'
require_relative '../helpers/data_services_metrics_helper'
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
require_dependency 'carto/bolt'
require_dependency 'carto/helpers/auth_token_generator'
require_dependency 'carto/helpers/has_connector_configuration'
require_dependency 'carto/helpers/batch_queries_statement_timeout'
require_dependency 'carto/user_authenticator'
require_dependency 'carto/helpers/billing_cycle'
require_dependency 'carto/email_cleaner'
require_dependency 'carto/email_domain_validator'
require_dependency 'carto/visualization'

class User < Sequel::Model
  include CartoDB::MiniSequel
  include CartoDB::UserDecorator
  include Concerns::CartodbCentralSynchronizable
  include CartoDB::ConfigUtils
  include DataServicesMetricsHelper
  include Carto::AuthTokenGenerator
  include Carto::HasConnectorConfiguration
  include Carto::BatchQueriesStatementTimeout
  include Carto::BillingCycle
  include Carto::EmailCleaner
  extend Carto::UserAuthenticator

  OAUTH_SERVICE_TITLES = {
    'gdrive' => 'Google Drive',
    'dropbox' => 'Dropbox',
    'box' => 'Box',
    'mailchimp' => 'MailChimp',
    'instagram' => 'Instagram'
  }.freeze

  OAUTH_SERVICE_REVOKE_URLS = {
    'mailchimp' => 'http://admin.mailchimp.com/account/oauth2/',
    'instagram' => 'http://instagram.com/accounts/manage_access/'
  }.freeze

  INDUSTRIES = ['Academic and Education', 'Architecture and Engineering', 'Banking and Finance',
                'Business Intelligence and Analytics', 'Utilities and Communications', 'GIS and Mapping',
                'Government', 'Health', 'Marketing and Advertising', 'Media, Entertainment and Publishing',
                'Natural Resources', 'Non-Profits', 'Real Estate', 'Software and Technology',
                'Transportation and Logistics'].freeze

  JOB_ROLES = ['Founder / Executive', 'Developer', 'Student', 'VP / Director', 'Manager / Lead',
               'Personal / Non-professional', 'Media', 'Individual Contributor'].freeze

  DEPRECATED_JOB_ROLES = ['Researcher', 'GIS specialist', 'Designer', 'Consultant / Analyst',
                          'CIO / Executive', 'Marketer', 'Sales', 'Journalist', 'Hobbyist', 'Government official'].freeze

  # Make sure the following date is after Jan 29, 2015,
  # which is the date where a message to accept the Terms and
  # conditions and the Privacy policy was included in the Signup page.
  # See https://github.com/CartoDB/cartodb-central/commit/3627da19f071c8fdd1604ddc03fb21ab8a6dff9f
  FULLSTORY_ENABLED_MIN_DATE = Date.new(2017, 1, 1)
  FULLSTORY_SUPPORTED_PLANS = ['FREE', 'PERSONAL30'].freeze

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

  DEFAULT_MAX_LAYERS = 8

  MIN_PASSWORD_LENGTH = 6
  MAX_PASSWORD_LENGTH = 64

  GEOCODING_BLOCK_SIZE = 1000
  HERE_ISOLINES_BLOCK_SIZE = 1000
  OBS_SNAPSHOT_BLOCK_SIZE = 1000
  OBS_GENERAL_BLOCK_SIZE = 1000
  MAPZEN_ROUTING_BLOCK_SIZE = 1000

  TRIAL_DURATION_DAYS = 15

  DEFAULT_GEOCODING_QUOTA = 0
  DEFAULT_HERE_ISOLINES_QUOTA = 0
  DEFAULT_MAPZEN_ROUTING_QUOTA = nil
  DEFAULT_OBS_SNAPSHOT_QUOTA = 0
  DEFAULT_OBS_GENERAL_QUOTA = 0

  DEFAULT_MAX_IMPORT_FILE_SIZE = 157286400
  DEFAULT_MAX_IMPORT_TABLE_ROW_COUNT = 500000
  DEFAULT_MAX_CONCURRENT_IMPORT_COUNT = 3

  COMMON_DATA_ACTIVE_DAYS = 31

  STATE_ACTIVE = 'active'.freeze
  STATE_LOCKED = 'locked'.freeze

  self.raise_on_typecast_failure = false
  self.raise_on_save_failure = false

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
    validates_presence :username
    validates_unique   :username
    validates_format /\A[a-z0-9\-]+\z/, :username, message: "must only contain lowercase letters, numbers and the dash (-) symbol"
    validates_format /\A[a-z0-9]{1}/, :username, message: "must start with alphanumeric chars"
    validates_format /[a-z0-9]{1}\z/, :username, message: "must end with alphanumeric chars"
    validates_max_length 63, :username
    errors.add(:name, 'is taken') if name_exists_in_organizations?

    validates_presence :email
    validates_unique   :email, :message => 'is already taken'
    validates_format EmailAddressValidator::Regexp::ADDR_SPEC, :email, :message => 'is not a valid address'

    validates_presence :password if new? && (crypted_password.blank? || salt.blank?)

    if new? || (password.present? && !@new_password.present?)
      errors.add(:password, "is not confirmed") unless password == password_confirmation
    end
    validate_password_change

    if organization.present?
      organization_validation
    elsif org_admin
      errors.add(:org_admin, "cannot be set for non-organization user")
    end

    validates_includes JOB_ROLES + DEPRECATED_JOB_ROLES, :job_role if job_role.present?

    errors.add(:geocoding_quota, "cannot be nil") if geocoding_quota.nil?
    errors.add(:here_isolines_quota, "cannot be nil") if here_isolines_quota.nil?
    errors.add(:obs_snapshot_quota, "cannot be nil") if obs_snapshot_quota.nil?
    errors.add(:obs_general_quota, "cannot be nil") if obs_general_quota.nil?
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

      organization.validate_seats(self, errors)
    end

    errors.add(:viewer, "cannot be enabled for organization admin") if organization_admin? && viewer
  end

  #                             +--------+---------+------+
  #       valid_privacy logic   | Public | Private | Link |
  #   +-------------------------+--------+---------+------+
  #   | private_tables_enabled  |    T   |    T    |   T  |
  #   | !private_tables_enabled |    T   |    F    |   F  |
  #   +-------------------------+--------+---------+------+
  #
  def valid_privacy?(privacy)
    private_tables_enabled || privacy == Carto::UserTable::PRIVACY_PUBLIC
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

      validate_different_passwords(nil, self.class.password_digest(value, salt), key)
    end

    errors[key].empty?
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
    self.obs_snapshot_quota ||= DEFAULT_OBS_SNAPSHOT_QUOTA
    self.obs_general_quota ||= DEFAULT_OBS_GENERAL_QUOTA
    self.mapzen_routing_quota ||= DEFAULT_MAPZEN_ROUTING_QUOTA
    self.soft_geocoding_limit = false if soft_geocoding_limit.nil?
    self.viewer = false if viewer.nil?
    self.org_admin = false if org_admin.nil?
    true
  end

  def before_create
    super
    self.database_host ||= ::SequelRails.configuration.environment_for(Rails.env)['host']
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

    db.after_commit { create_api_keys } if has_feature_flag?('auth_api')

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
    builder? && common_data_outdated?
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

    # API keys management
    sync_master_key if changes.include?(:api_key)
    sync_default_public_key if changes.include?(:database_schema)
    $users_metadata.HSET(key, 'map_key', User.make_token) if locked?
    db.after_commit { sync_enabled_api_keys } if changes.include?(:engine_enabled) || changes.include?(:state)

    if changes.include?(:org_admin) && !organization_owner?
      org_admin ? db_service.grant_admin_permissions : db_service.revoke_admin_permissions
    end
  end

  def api_keys
    Carto::ApiKey.where(user_id: id)
  end

  def shared_entities
    CartoDB::SharedEntity.join(:visualizations, id: :entity_id).where(user_id: id)
  end

  def has_shared_entities?
    # Right now, cannot delete users with entities shared with other users or the org.
    shared_entities.first.present?
  end

  def ensure_nonviewer
    # A viewer can't destroy data, this allows the cleanup. Down to dataset level
    # to skip model hooks.
    if viewer
      this.update(viewer: false)
      self.viewer = false
    end
  end

  def set_force_destroy
    @force_destroy = true
  end

  def before_destroy(skip_table_drop: false)
    ensure_nonviewer

    @org_id_for_org_wipe = nil
    error_happened = false
    has_organization = false

    unless organization.nil?
      organization.reload # Avoid ORM caching

      if organization.owner_id == id
        @org_id_for_org_wipe = organization.id # after_destroy will wipe the organization too

        if organization.users.count > 1
          msg = 'Attempted to delete owner from organization with other users'
          CartoDB::StdoutLogger.info msg
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
        Carto::VisualizationQueryBuilder.new.with_user_id(id).build.all.each(&:destroy)
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
    rescue StandardError => exception
      error_happened = true
      CartoDB::StdoutLogger.info "Error destroying user #{username}. #{exception.message}\n#{exception.backtrace}"
    end

    # Invalidate user cache
    invalidate_varnish_cache

    drop_database(has_organization) unless skip_table_drop || error_happened

    # Remove metadata from redis last (to avoid cutting off access to SQL API if db deletion fails)
    unless error_happened
      $users_metadata.DEL(key)
      $users_metadata.DEL(timeout_key)
    end

    feature_flags_user.each(&:delete)
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

    # we need to wait for the deletion to be commited because of the mix of Sequel (user)
    # and AR (rate_limit) models and rate_limit_id being a FK in the users table
    db.after_commit do
      begin
        rate_limit.try(:destroy_completely, self)
      rescue => e
        CartoDB::Logger.error(message: 'Error deleting rate limit at user deletion', exception: e)
      end
    end
  end

  def invalidate_varnish_cache(options = {})
    options[:regex] ||= '.*'
    CartoDB::Varnish.new.purge("#{database_name}#{options[:regex]}")
  end

  # allow extra vars for auth
  attr_reader :password

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

    @old_password = old_password
    @new_password = new_password_value
    @new_password_confirmation = new_password_confirmation_value

    @old_password_validated = validate_old_password(old_password)
    return unless @old_password_validated

    return unless valid_password?(:new_password, new_password_value, new_password_confirmation_value)
    return unless validate_different_passwords(@old_password, @new_password)

    # Must be set AFTER validations
    set_last_password_change_date

    self.password = new_password_value
  end

  def validate_different_passwords(old_password = nil, new_password = nil, key = :new_password)
    unless different_passwords?(old_password, new_password)
      errors.add(key, 'New password cannot be the same as old password')
    end
    errors[key].empty?
  end

  def different_passwords?(old_password = nil, new_password = nil)
    return true if new? || (@changing_passwords && !old_password)
    old_password = carto_user.crypted_password_was unless old_password.present?
    new_password = crypted_password unless old_password.present? && new_password.present?

    old_password.present? && old_password != new_password
  end

  def validate_old_password(old_password)
    (self.class.password_digest(old_password, salt) == crypted_password) ||
      (oauth_signin? && last_password_change_date.nil?)
  end

  def valid_password_confirmation(password)
    valid = password.present? && validate_old_password(password)
    errors.add(:password, 'Confirmation password sent does not match your current password') unless valid
    valid
  end

  def should_display_old_password?
    needs_password_confirmation?
  end

  # Some operations, such as user deletion, won't ask for password confirmation if password is not set
  # (because of Google/Github sign in, for example)
  def needs_password_confirmation?
    (!oauth_signin? || last_password_change_date.present?) &&
      !created_with_http_authentication? &&
      !organization.try(:auth_saml_enabled?)
  end
  alias :password_set? :needs_password_confirmation?

  def oauth_signin?
    google_sign_in || github_user_id.present?
  end

  def created_with_http_authentication?
    Carto::UserCreation.http_authentication.find_by_user_id(id).present?
  end

  def password_confirmation
    @password_confirmation
  end

  def password_confirmation=(password_confirmation)
    set_last_password_change_date
    @password_confirmation = password_confirmation
  end

  def password=(value)
    return if !Carto::Ldap::Manager.new.configuration_present? && !valid_password?(:password, value, value)

    @password = value
    self.salt = new? ? self.class.make_token : ::User.filter(id: id).select(:salt).first.salt
    self.crypted_password = self.class.password_digest(value, salt)
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
  rescue => exception
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

  # List all public visualization tags of the user
  def tags(exclude_shared = false, type = Carto::Visualization::TYPE_DERIVED)
    require_relative './visualization/tags'
    options = {}
    options[:exclude_shared] = true if exclude_shared
    CartoDB::Visualization::Tags.new(self, options).names({
      type: type,
      privacy: Carto::Visualization::PRIVACY_PUBLIC
    })
  end #tags

  # List all public map tags of the user
  def map_tags
    require_relative './visualization/tags'
    CartoDB::Visualization::Tags.new(self).names({
      type: Carto::Visualization::TYPE_CANONICAL,
      privacy: Carto::Visualization::PRIVACY_PUBLIC
    })
  end #map_tags

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

  def remaining_days_deletion
    return nil unless state == STATE_LOCKED
    begin
      deletion_date = Cartodb::Central.new.get_user(username).fetch('scheduled_deletion_date', nil)
      return nil unless deletion_date
      (deletion_date.to_date - Date.today).to_i
    rescue => e
      CartoDB::Logger.warning(exception: e, message: 'Something went wrong calculating the number of remaining days for account deletion')
      return nil
    end
  end

  def remove_logo?
    has_organization? ? organization.no_map_logo : no_map_logo
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

  def soft_obs_snapshot_limit?
    Carto::AccountType.new.soft_obs_snapshot_limit?(self)
  end
  alias_method :soft_obs_snapshot_limit, :soft_obs_snapshot_limit?

  def hard_obs_snapshot_limit?
    !soft_obs_snapshot_limit?
  end
  alias_method :hard_obs_snapshot_limit, :hard_obs_snapshot_limit?

  def hard_obs_snapshot_limit=(val)
    self[:soft_obs_snapshot_limit] = !val
  end

  def soft_obs_general_limit?
    Carto::AccountType.new.soft_obs_general_limit?(self)
  end
  alias_method :soft_obs_general_limit, :soft_obs_general_limit?

  def hard_obs_general_limit?
    !soft_obs_general_limit?
  end
  alias_method :hard_obs_general_limit, :hard_obs_general_limit?

  def hard_obs_general_limit=(val)
    self[:soft_obs_general_limit] = !val
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

  def soft_mapzen_routing_limit?
    Carto::AccountType.new.soft_mapzen_routing_limit?(self)
  end
  alias_method :soft_mapzen_routing_limit, :soft_mapzen_routing_limit?

  def hard_mapzen_routing_limit?
    !self.soft_mapzen_routing_limit?
  end
  alias_method :hard_mapzen_routing_limit, :hard_mapzen_routing_limit?

  def hard_mapzen_routing_limit=(val)
    self[:soft_mapzen_routing_limit] = !val
  end

  def private_maps_enabled?
    !!private_maps_enabled
  end

  def viewable_by?(viewer)
    id == viewer.id || organization.try(:admin?, viewer)
  end

  def editable_by?(user)
    id == user.id || user.belongs_to_organization?(organization) && (user.organization_owner? || !organization_admin?)
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

  def timeout_key
    "limits:timeout:#{username}"
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
                          'obs_snapshot_quota',        obs_snapshot_quota,
                          'soft_obs_snapshot_limit',   soft_obs_snapshot_limit,
                          'obs_general_quota',         obs_general_quota,
                          'soft_obs_general_limit',    soft_obs_general_limit,
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
                          'render_public',             database_render_timeout
    save_rate_limits
  end

  def save_rate_limits
    return unless has_feature_flag?('limits_v2')
    effective_rate_limit.save_to_redis(self)
  rescue => e
    CartoDB::Logger.error(message: 'Error saving rate limits to redis', exception: e)
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
    CartoDB::Logger.error(message: 'Error retrieving user rate limits', exception: e)
  end

  def effective_account_type
    organization_user? && organization.owner ? organization.owner.carto_account_type : carto_account_type
  end

  def rate_limit
    Carto::RateLimit.find(rate_limit_id) if rate_limit_id
  end

  def carto_account_type
    Carto::AccountType.find(account_type)
  end

  def get_auth_tokens
    tokens = [get_auth_token]
    if has_organization?
      tokens << organization.get_auth_token
      tokens += groups.map(&:get_auth_token)
    end
    tokens
  end

  # Should return the number of tweets imported by this user for the specified period of time, as an integer
  def get_twitter_imports_count(options = {})
    date_from, date_to = quota_dates(options)
    SearchTweet.get_twitter_imports_count(self.search_tweets_dataset, date_from, date_to)
  end
  alias get_twitter_datasource_calls get_twitter_imports_count

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

  def get_obs_snapshot_calls(options = {})
    date_from, date_to = quota_dates(options)
    get_user_obs_snapshot_data(self, date_from, date_to)
  end

  def get_obs_general_calls(options = {})
    date_from, date_to = quota_dates(options)
    get_user_obs_general_data(self, date_from, date_to)
  end

  def get_mapzen_routing_calls(options = {})
    date_from, date_to = quota_dates(options)
    get_user_mapzen_routing_data(self, date_from, date_to)
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

  def remaining_obs_snapshot_quota
    if organization.present?
      remaining = organization.remaining_obs_snapshot_quota
    else
      remaining = obs_snapshot_quota - get_obs_snapshot_calls
    end
    (remaining > 0 ? remaining : 0)
  end

  def remaining_obs_general_quota
    if organization.present?
      remaining = organization.remaining_obs_general_quota
    else
      remaining = obs_general_quota - get_obs_general_calls
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

  def cant_be_deleted_reason
    if organization_owner?
      "You can't delete your account because you are admin of an organization"
    elsif Carto::UserCreation.http_authentication.where(user_id: id).first.present?
      "You can't delete your account because you are using HTTP Header Authentication"
    end
  end

  def get_oauth_services
    datasources = CartoDB::Datasources::DatasourcesFactory.get_all_oauth_datasources
    array = []

    datasources.each do |serv|
      obj ||= Hash.new

      title = OAUTH_SERVICE_TITLES.fetch(serv, serv)
      revoke_url = OAUTH_SERVICE_REVOKE_URLS.fetch(serv, nil)
      enabled = case serv
      when 'gdrive'
        Cartodb.config[:oauth][serv]['client_id'].present?
      when 'box'
        Cartodb.config[:oauth][serv]['client_id'].present?
      when 'gdrive'
        Cartodb.config[:oauth][serv]['client_id'].present?
      when 'dropbox'
        Cartodb.config[:oauth]['dropbox']['app_key'].present?
      when 'mailchimp'
        Cartodb.config[:oauth]['mailchimp']['app_key'].present? && has_feature_flag?('mailchimp_import')
      when 'instagram'
        Cartodb.config[:oauth]['instagram']['app_key'].present? && has_feature_flag?('instagram_import')
      else
        true
      end

      if enabled
        oauth = oauths.select(serv)

        obj['name'] = serv
        obj['title'] = title
        obj['revoke_url'] = revoke_url
        obj['connected'] = !oauth.nil? ? true : false

        array.push(obj)
      end
    end

    array
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
        CartoDB::Logger.error(exception: ee)
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

  def remaining_quota(_use_total = false, db_size_in_bytes = self.db_size_in_bytes)
    return nil unless db_size_in_bytes

    quota_in_bytes - db_size_in_bytes
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
    visualization_count({
                          type: Carto::Visualization::TYPE_DERIVED,
                          privacy: Carto::Visualization::PRIVACY_PUBLIC,
                          exclude_shared: true,
                          exclude_raster: true
                        })
  end

  # Get the count of all visualizations
  def all_visualization_count
    visualization_count({
                          type: Carto::Visualization::TYPE_DERIVED,
                          exclude_shared: false,
                          exclude_raster: false
                        })
  end

  # Get user owned visualizations
  def owned_visualizations_count
    visualization_count({
                          type: Carto::Visualization::TYPE_DERIVED,
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
    vqb.build.count
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
    setup_aggregation_tables
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

  def update_payment_url(request_protocol)
    account_url(request_protocol) + '/update_payment'
  end

  # Special url that goes to Central if active
  def upgrade_url(request_protocol)
    cartodb_com_hosted? ? '' : (account_url(request_protocol) + '/upgrade')
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
    base_subdomain = subdomain_override.nil? ? subdomain : subdomain_override
    CartoDB.base_url(base_subdomain, CartoDB.organization_username(self), protocol_override)
  end

  # ----------

  def name_or_username
    name.present? || last_name.present? ? [name, last_name].select(&:present?).join(' ') : username
  end

  # Probably not needed with versioning of keys
  # @see RedisVizjsonCache
  # @see EmbedRedisCache
  def purge_redis_vizjson_cache
    vizs = Carto::VisualizationQueryBuilder.new.with_user_id(id).build.all
    CartoDB::Visualization::RedisVizjsonCache.new().purge(vizs)
    EmbedRedisCache.new().purge(vizs)
  end

  # returns google maps api key. If the user is in an organization and
  # that organization has api key it's used
  def google_maps_api_key
    organization.try(:google_maps_key).blank? ? google_maps_key : organization.google_maps_key
  end

  # TODO: this is the correct name for what's stored in the model, refactor changing that name
  alias_method :google_maps_query_string, :google_maps_api_key

  # Returns the google maps private key. If the user is in an organization and
  # that organization has a private key, the org's private key is returned.
  def google_maps_private_key
    organization.try(:google_maps_private_key).blank? ? super : organization.google_maps_private_key
  end

  def google_maps_geocoder_enabled?
    google_maps_private_key.present? && google_maps_client_id.present?
  end

  def google_maps_client_id
    Rack::Utils.parse_nested_query(google_maps_query_string)['client'] if google_maps_query_string
  end

  # returns a list of basemaps enabled for the user
  def basemaps
    (Cartodb.config[:basemaps] || []).select { |group| group != 'GMaps' || google_maps_enabled? }
  end

  def google_maps_enabled?
    google_maps_query_string.present?
  end

  # return the default basemap based on the default setting. If default attribute is not set, first basemaps is returned
  # it only takes into account basemaps enabled for that user
  def default_basemap
    default = google_maps_enabled? && basemaps['GMaps'].present? ? basemaps.slice('GMaps') : basemaps
    Cartodb.default_basemap(default)
  end

  def copy_account_features(to)
    to.set_fields(self, [
      :private_tables_enabled, :sync_tables_enabled, :max_layers, :user_timeout,
      :database_timeout, :geocoding_quota, :map_view_quota, :table_quota, :database_host,
      :period_end_date, :map_view_block_price, :geocoding_block_price, :account_type,
      :twitter_datasource_enabled, :soft_twitter_datasource_limit, :twitter_datasource_quota,
      :twitter_datasource_block_price, :twitter_datasource_block_size, :here_isolines_quota,
      :here_isolines_block_price, :soft_here_isolines_limit, :obs_snapshot_quota,
      :obs_snapshot_block_price, :soft_obs_snapshot_limit, :obs_general_quota,
      :obs_general_block_price, :soft_obs_general_limit
    ])
    to.invite_token = ::User.make_token
  end

  def regenerate_api_key(new_api_key = ::User.make_token)
    invalidate_varnish_cache
    update api_key: new_api_key
  end

  def regenerate_all_api_keys
    regenerate_api_key
    api_keys.regular.each(&:regenerate_token!)
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

  def mobile_sdk_enabled?
    private_apps_enabled? || open_apps_enabled?
  end

  def private_apps_enabled?
    mobile_max_private_users > 0
  end

  def open_apps_enabled?
    mobile_max_open_users > 0
  end

  def builder?
    !viewer?
  end

  def viewer?
    viewer
  end

  def organization_admin?
    organization_user? && (organization_owner? || org_admin)
  end

  def builder_enabled?
    if has_organization? && builder_enabled.nil?
      organization.builder_enabled
    else
      !!builder_enabled
    end
  end

  def engine_enabled?
    if has_organization? && engine_enabled.nil?
      organization.engine_enabled
    else
      !!engine_enabled
    end
  end

  def new_visualizations_version
    builder_enabled? ? 3 : 2
  end

  def destroy_cascade
    set_force_destroy
    destroy
  end

  def relevant_frontend_version
    frontend_version || CartoDB::Application.frontend_version
  end

  def active?
    state == STATE_ACTIVE
  end

  def locked?
    state == STATE_LOCKED
  end

  # Central will request some data back to cartodb (quotas, for example), so the user still needs to exist.
  # Corollary: multithreading is needed for deletion to work.
  def destroy_account
    delete_in_central
    destroy
  end

  def carto_user
    @carto_user ||= Carto::User.find(id)
  end

  def create_api_keys
    carto_user.api_keys.create_master_key! unless carto_user.api_keys.master.exists?
    carto_user.api_keys.create_default_public_key! unless carto_user.api_keys.default_public.exists?
  end

  def fullstory_enabled?
    FULLSTORY_SUPPORTED_PLANS.include?(account_type) && created_at > FULLSTORY_ENABLED_MIN_DATE
  end

  def password_expired?
    return false unless password_expiration_in_d && password_set?
    password_date + password_expiration_in_d.days.to_i < Time.now
  end

  def password_expiration_in_d
    organization_user? ? organization.password_expiration_in_d : Cartodb.get_config(:passwords, 'expiration_in_d')
  end

  def password_date
    last_password_change_date || created_at
  end

  private

  def common_data_outdated?
    last_common_data_update_date.nil? || last_common_data_update_date < Time.now - COMMON_DATA_ACTIVE_DAYS.day
  end

  def destroy_shared_with
    CartoDB::SharedEntity.where(recipient_id: id).each do |se|
      viz = Carto::Visualization.find(se.entity_id)
      permission = viz.permission
      permission.remove_user_permission(self)
      permission.save
    end
  end

  def get_invitation_token_from_user_creation
    user_creation = get_user_creation
    if !user_creation.nil? && user_creation.has_valid_invitation?
      user_creation.invitation_token
    end
  end

  def get_user_creation
    @user_creation ||= Carto::UserCreation.find_by_user_id(id)
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
    search_tweets_dataset.all.each do |st|
      st.user = organization.owner
      st.save(raise_on_failure: true)
    end
  rescue => e
    CartoDB::Logger.error(exception: e, message: 'Error assigning search tweets to org owner', user: self)
  end

  # INFO: assigning to owner is necessary because of payment reasons
  def assign_geocodings_to_organization_owner
    return if organization.nil? || organization.owner.nil? || organization_owner?
    geocodings_dataset.all.each do |g|
      g.user = organization.owner
      g.data_import_id = nil
      g.save(raise_on_failure: true)
    end
  rescue => e
    CartoDB::Logger.error(exception: e, message: 'Error assigning geocodings to org owner', user: self)
    geocodings.each(&:destroy)
  end

  def name_exists_in_organizations?
    !Organization.where(name: self.username).first.nil?
  end

  def set_last_password_change_date
    self.last_password_change_date = Time.zone.now unless new?
  end

  def set_viewer_quotas
    self.quota_in_bytes = 0 unless quota_in_bytes == 0
    self.geocoding_quota = 0 unless geocoding_quota == 0
    self.soft_geocoding_limit = false if soft_geocoding_limit
    self.twitter_datasource_quota = 0 unless twitter_datasource_quota == 0
    self.soft_twitter_datasource_limit = false if soft_twitter_datasource_limit
    self.here_isolines_quota = 0 unless here_isolines_quota == 0
    self.soft_here_isolines_limit = false if soft_here_isolines_limit
    self.obs_snapshot_quota = 0 unless obs_snapshot_quota == 0
    self.soft_obs_snapshot_limit = false if soft_obs_snapshot_limit
    self.obs_general_quota = 0 unless obs_general_quota == 0
    self.soft_obs_general_limit = false if soft_obs_general_limit
  end

  def revoke_rw_permission_on_shared_entities
    rw_permissions = visualizations_shared_with_this_user
                     .map(&:permission)
                     .select { |p| p.permission_for_user(self) == CartoDB::Permission::ACCESS_READWRITE }

    rw_permissions.each do |p|
      p.remove_user_permission(self)
      p.set_user_permission(self, CartoDB::Permission::ACCESS_READONLY)
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

  def created_via
    @created_via || get_user_creation.try(:created_via)
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
    api_keys.each(&:set_enabled_for_engine)
  end
end

require 'active_record'
require 'cartodb-common'
require_relative 'user_service'
require_relative 'user_db_service'
require_relative 'synchronization_oauth'
require_relative '../../helpers/data_services_metrics_helper'
require_dependency 'carto/helpers/auth_token_generator'
require_dependency 'carto/helpers/has_connector_configuration'
require_dependency 'carto/helpers/batch_queries_statement_timeout'
require_dependency 'carto/helpers/billing_cycle'

# TODO: This probably has to be moved as the service of the proper User Model
class Carto::User < ActiveRecord::Base
  extend Forwardable
  include DataServicesMetricsHelper
  include Carto::AuthTokenGenerator
  include Carto::HasConnectorConfiguration
  include Carto::BatchQueriesStatementTimeout
  include Carto::BillingCycle

  GEOCODING_BLOCK_SIZE = 1000
  HERE_ISOLINES_BLOCK_SIZE = 1000
  OBS_SNAPSHOT_BLOCK_SIZE = 1000
  OBS_GENERAL_BLOCK_SIZE = 1000
  MAPZEN_ROUTING_BLOCK_SIZE = 1000

  STATE_ACTIVE = 'active'.freeze
  STATE_LOCKED = 'locked'.freeze

  # Make sure the following date is after Jan 29, 2015,
  # which is the date where a message to accept the Terms and
  # conditions and the Privacy policy was included in the Signup page.
  # See https://github.com/CartoDB/cartodb-central/commit/3627da19f071c8fdd1604ddc03fb21ab8a6dff9f
  FULLSTORY_ENABLED_MIN_DATE = Date.new(2017, 1, 1)
  FULLSTORY_SUPPORTED_PLANS = ['FREE', 'PERSONAL30', 'Individual'].freeze

  MAGELLAN_TRIAL_DAYS = 15
  PERSONAL30_TRIAL_DAYS = 30
  INDIVIDUAL_TRIAL_DAYS = 14
  TRIAL_PLANS = ['personal30', 'individual'].freeze

  # INFO: select filter is done for security and performance reasons. Add new columns if needed.
  DEFAULT_SELECT = "users.email, users.username, users.admin, users.organization_id, users.id, users.avatar_url," \
                   "users.api_key, users.database_schema, users.database_name, users.name, users.location," \
                   "users.disqus_shortname, users.account_type, users.twitter_username, users.google_maps_key, " \
                   "users.viewer, users.quota_in_bytes, users.database_host, users.crypted_password, " \
                   "users.builder_enabled, users.private_tables_enabled, users.private_maps_enabled, " \
                   "users.org_admin, users.last_name, users.google_maps_private_key, users.website, " \
                   "users.description, users.available_for_hire, users.frontend_version, users.asset_host, "\
                   "users.no_map_logo, users.industry, users.company, users.phone, users.job_role, "\
                   "users.public_map_quota, users.maintenance_mode, users.company_employees, users.use_case".freeze

  has_many :tables, class_name: Carto::UserTable, inverse_of: :user
  has_many :visualizations, inverse_of: :user
  has_many :maps, inverse_of: :user
  has_many :layers_user
  has_many :layers, through: :layers_user, after_add: Proc.new { |user, layer| layer.set_default_order(user) }

  belongs_to :organization, inverse_of: :users
  belongs_to :rate_limit
  has_one :owned_organization, class_name: Carto::Organization, inverse_of: :owner, foreign_key: :owner_id
  has_one :static_notifications, class_name: Carto::UserNotification, inverse_of: :user

  has_many :feature_flags_user, dependent: :destroy, foreign_key: :user_id, inverse_of: :user
  has_many :feature_flags, through: :feature_flags_user
  has_many :assets, inverse_of: :user
  has_many :data_imports, inverse_of: :user
  has_many :geocodings, inverse_of: :user
  has_many :synchronization_oauths, class_name: Carto::SynchronizationOauth, inverse_of: :user, dependent: :destroy
  has_many :search_tweets, inverse_of: :user
  has_many :synchronizations, inverse_of: :user
  has_many :tags, inverse_of: :user
  has_many :permissions, inverse_of: :owner, foreign_key: :owner_id
  has_many :connector_configurations, inverse_of: :user, dependent: :destroy

  has_many :client_applications, class_name: Carto::ClientApplication
  has_many :oauth_tokens, class_name: Carto::OauthToken

  has_many :users_group, dependent: :destroy, class_name: Carto::UsersGroup
  has_many :groups, through: :users_group

  has_many :received_notifications, inverse_of: :user

  has_many :api_keys, inverse_of: :user
  has_many :user_multifactor_auths, inverse_of: :user, class_name: Carto::UserMultifactorAuth

  has_many :oauth_apps, inverse_of: :user, dependent: :destroy
  has_many :oauth_app_users, inverse_of: :user, dependent: :destroy
  has_many :granted_oauth_apps, through: :oauth_app_users, class_name: Carto::OauthApp, source: 'oauth_app'

  delegate [
    :database_username, :database_password, :in_database,
    :db_size_in_bytes, :get_api_calls, :table_count, :public_visualization_count, :all_visualization_count,
    :visualization_count, :owned_visualization_count, :twitter_imports_count,
    :link_privacy_visualization_count, :password_privacy_visualization_count, :public_privacy_visualization_count
  ] => :service

  attr_reader :password

  # TODO: From sequel, can be removed once finished
  alias_method :maps_dataset, :maps
  alias_method :layers_dataset, :layers
  alias_method :assets_dataset, :assets
  alias_method :data_imports_dataset, :data_imports
  alias_method :geocodings_dataset, :geocodings

  before_create :set_database_host
  before_create :generate_api_key

  after_save { reset_password_rate_limit if crypted_password_changed? }

  after_destroy { rate_limit.destroy_completely(self) if rate_limit }
  after_destroy :invalidate_varnish_cache

  LOGIN_NOT_RATE_LIMITED = -1

  MULTIFACTOR_AUTHENTICATION_ENABLED = 'enabled'.freeze
  MULTIFACTOR_AUTHENTICATION_DISABLED = 'disabled'.freeze
  MULTIFACTOR_AUTHENTICATION_NEEDS_SETUP = 'setup'.freeze

  include ::VarnishCacheHandler

  # Auto creates notifications on first access
  def static_notifications_with_creation
    static_notifications_without_creation || build_static_notifications(user: self, notifications: {})
  end
  alias_method_chain :static_notifications, :creation

  def name_or_username
    name.present? || last_name.present? ? [name, last_name].select(&:present?).join(' ') : username
  end

  def password_validator
    if organization.try(:strong_passwords_enabled)
      Carto::PasswordValidator.new(Carto::StrongPasswordStrategy.new)
    else
      Carto::PasswordValidator.new(Carto::StandardPasswordStrategy.new)
    end
  end

  def password=(value)
    return if !value.nil? && password_validator.validate(value, value, self).any?

    @password = value
    self.crypted_password = Carto::Common::EncryptionService.encrypt(password: value,
                                                                     secret: Cartodb.config[:password_secret])
  end

  def reset_password_rate_limit
    $users_metadata.DEL rate_limit_password_key if password_rate_limit_configured?
  end

  def rate_limit_password_key
    "limits:password:#{username}"
  end

  def password_login_attempt
    return LOGIN_NOT_RATE_LIMITED unless password_rate_limit_configured?

    rate_limit = $users_metadata.call('CL.THROTTLE', rate_limit_password_key, @max_burst, @count, @period)

    # it returns the number of seconds until the user should retry
    # -1 means the action was allowed
    # see https://github.com/brandur/redis-cell#response
    rate_limit[3]
  end

  def password_confirmation=(password_confirmation)
    # TODO: Implement
  end

  def default_avatar
    "cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png"
  end

  def feature_flag_names
    @feature_flag_names ||= (feature_flags_user.map do |ff|
                               ff.feature_flag.name
                             end +
                            FeatureFlag.where(restricted: false).map(&:name)).uniq.sort
  end

  # TODO: Revisit methods below to delegate to the service, many look like not proper of the model itself

  def service
    @service ||= Carto::UserService.new(self)
  end

  def db_service
    @db_service ||= Carto::UserDBService.new(self)
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

  def default_dataset_privacy
    Carto::UserTable::PRIVACY_VALUES_TO_TEXTS[default_table_privacy]
  end

  def default_table_privacy
    private_tables_enabled ? Carto::UserTable::PRIVACY_PRIVATE : Carto::UserTable::PRIVACY_PUBLIC
  end

  # @return String public user url, which is also the base url for a given user
  def public_url(subdomain_override = nil, protocol_override = nil)
    base_subdomain = subdomain_override.nil? ? subdomain : subdomain_override
    CartoDB.base_url(base_subdomain, CartoDB.organization_username(self), protocol_override)
  end

  def subdomain
    if CartoDB.subdomainless_urls?
      username
    else
      organization.nil? ? username : organization.name
    end
  end

  def feature_flags_list
    @feature_flag_names ||= (feature_flags_user
                                 .map { |ff| ff.feature_flag.name } + FeatureFlag.where(restricted: false)
                                                                                 .map(&:name)).uniq.sort
  end

  def has_feature_flag?(feature_flag_name)
    feature_flags_list.present? && feature_flags_list.include?(feature_flag_name)
  end

  def has_organization?
    !organization_id.nil?
  end

  def avatar
    avatar_url.nil? ? "//#{default_avatar}" : avatar_url
  end

  def remove_logo?
    has_organization? ? organization.no_map_logo? : no_map_logo?
  end

  def sql_safe_database_schema
    database_schema.include?('-') ? "\"#{database_schema}\"" : database_schema
  end

  def database_public_username
    database_schema == CartoDB::DEFAULT_DB_SCHEMA ? CartoDB::PUBLIC_DB_USER : "cartodb_publicuser_#{id}"
  end

  # returns google maps api key. If the user is in an organization and
  # that organization has api key it's used
  def google_maps_api_key
    organization.try(:google_maps_key).blank? ? google_maps_key : organization.google_maps_key
  end

  def twitter_datasource_enabled
    (read_attribute(:twitter_datasource_enabled) || organization.try(&:twitter_datasource_enabled)) && twitter_configured?
  end

  def twitter_configured?
    # DatasourcesFactory.config_for takes configuration from organization if user is an organization user
    CartoDB::Datasources::DatasourcesFactory.customized_config?(Search::Twitter::DATASOURCE_NAME, self)
  end

  # TODO: this is the correct name for what's stored in the model, refactor changing that name
  alias_method :google_maps_query_string, :google_maps_api_key

  # Returns the google maps private key. If the user is in an organization and
  # that organization has a private key, the org's private key is returned.
  def google_maps_private_key
    if organization.try(:google_maps_private_key).blank?
      read_attribute(:google_maps_private_key)
    else
      organization.google_maps_private_key
    end
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
    default = if google_maps_enabled? && basemaps['GMaps'].present?
                ['GMaps', basemaps['GMaps']]
              else
                basemaps.find { |_, group_basemaps| group_basemaps.find { |_, attr| attr['default'] } }
              end
    default ||= basemaps.first
    # return only the attributes
    default[1].first[1]
  end

  def remaining_geocoding_quota(options = {})
    remaining = if organization.present?
                  organization.remaining_geocoding_quota(options)
                else
                  geocoding_quota - get_geocoding_calls(options)
                end
    (remaining > 0 ? remaining : 0)
  end

  def remaining_here_isolines_quota(options = {})
    remaining = if organization.present?
                  organization.remaining_here_isolines_quota(options)
                else
                  here_isolines_quota - get_here_isolines_calls(options)
                end
    (remaining > 0 ? remaining : 0)
  end

  def remaining_obs_snapshot_quota(options = {})
    remaining = if organization.present?
                  organization.remaining_obs_snapshot_quota(options)
                else
                  obs_snapshot_quota - get_obs_snapshot_calls(options)
                end
    (remaining > 0 ? remaining : 0)
  end

  def remaining_obs_general_quota(options = {})
    remaining = if organization.present?
                  organization.remaining_obs_general_quota(options)
                else
                  obs_general_quota - get_obs_general_calls(options)
                end
    (remaining > 0 ? remaining : 0)
  end

  def remaining_mapzen_routing_quota(options = {})
    remaining = if organization.present?
                  organization.remaining_mapzen_routing_quota(options)
                else
                  mapzen_routing_quota.to_i - get_mapzen_routing_calls(options)
                end
    (remaining > 0 ? remaining : 0)
  end

  def oauth_for_service(service)
    synchronization_oauths.where(service: service).first
  end

  # INFO: don't use, use CartoDB::OAuths#add instead
  def add_oauth(service, token)
    # INFO: this should be the right way, but there's a problem with pgbouncer:
    # ActiveRecord::StatementInvalid: PG::Error: ERROR:  prepared statement "a1" does not exist
    # synchronization_oauths.create(
    #    service:  service,
    #    token:    token
    # )
    # INFO: even this fails eventually, th the same error. See https://github.com/CartoDB/cartodb/issues/4003
    synchronization_oauth = Carto::SynchronizationOauth.new(
      user_id: id,
      service: service,
      token: token
    )
    synchronization_oauth.save
    synchronization_oauths.append(synchronization_oauth)
    synchronization_oauth
  end

  def get_geocoding_calls(options = {})
    date_from, date_to, orgwise = ds_metrics_parameters_from_options(options)
    get_user_geocoding_data(self, date_from, date_to, orgwise)
  end

  def get_here_isolines_calls(options = {})
    date_from, date_to, orgwise = ds_metrics_parameters_from_options(options)
    get_user_here_isolines_data(self, date_from, date_to, orgwise)
  end

  def get_obs_snapshot_calls(options = {})
    date_from, date_to, orgwise = ds_metrics_parameters_from_options(options)
    get_user_obs_snapshot_data(self, date_from, date_to, orgwise)
  end

  def get_obs_general_calls(options = {})
    date_from, date_to, orgwise = ds_metrics_parameters_from_options(options)
    get_user_obs_general_data(self, date_from, date_to, orgwise)
  end

  def get_mapzen_routing_calls(options = {})
    date_from, date_to, orgwise = ds_metrics_parameters_from_options(options)
    get_user_mapzen_routing_data(self, date_from, date_to, orgwise)
  end

  # TODO: Remove unused param `use_total`
  def remaining_quota(_use_total = false, db_size = service.db_size_in_bytes)
    return nil unless db_size

    quota_in_bytes - db_size
  end

  # can be nil table quotas
  def remaining_table_quota
    if table_quota.present?
      remaining = table_quota - service.table_count
      remaining < 0 ? 0 : remaining
    end
  end

  def organization_user?
    organization.present?
  end

  def belongs_to_organization?(organization)
    organization_user? && !organization.nil? && organization_id == organization.id
  end

  def soft_geocoding_limit?
    Carto::AccountType.new.soft_geocoding_limit?(self)
  end
  alias_method :soft_geocoding_limit, :soft_geocoding_limit?

  def hard_geocoding_limit?
    !soft_geocoding_limit?
  end
  alias_method :hard_geocoding_limit, :hard_geocoding_limit?

  def soft_here_isolines_limit?
    Carto::AccountType.new.soft_here_isolines_limit?(self)
  end
  alias_method :soft_here_isolines_limit, :soft_here_isolines_limit?

  def hard_here_isolines_limit?
    !soft_here_isolines_limit?
  end
  alias_method :hard_here_isolines_limit, :hard_here_isolines_limit?

  def soft_obs_snapshot_limit?
    Carto::AccountType.new.soft_obs_snapshot_limit?(self)
  end
  alias_method :soft_obs_snapshot_limit, :soft_obs_snapshot_limit?

  def hard_obs_snapshot_limit?
    !soft_obs_snapshot_limit?
  end
  alias_method :hard_obs_snapshot_limit, :hard_obs_snapshot_limit?

  def soft_obs_general_limit?
    Carto::AccountType.new.soft_obs_general_limit?(self)
  end
  alias_method :soft_obs_general_limit, :soft_obs_general_limit?

  def hard_obs_general_limit?
    !soft_obs_general_limit?
  end
  alias_method :hard_obs_general_limit, :hard_obs_general_limit?

  def soft_twitter_datasource_limit?
    soft_twitter_datasource_limit == true
  end

  def hard_twitter_datasource_limit?
    !soft_twitter_datasource_limit?
  end
  alias_method :hard_twitter_datasource_limit, :hard_twitter_datasource_limit?

  def soft_mapzen_routing_limit?
    Carto::AccountType.new.soft_mapzen_routing_limit?(self)
  end
  alias_method :soft_mapzen_routing_limit, :soft_mapzen_routing_limit?

  def hard_mapzen_routing_limit?
    !soft_mapzen_routing_limit?
  end
  alias_method :hard_mapzen_routing_limit, :hard_mapzen_routing_limit?
  def trial_ends_at
    if account_type.to_s.casecmp('magellan').zero? && upgraded_at && upgraded_at + 15.days > Date.today
      upgraded_at + MAGELLAN_TRIAL_DAYS.days
    elsif account_type.to_s.casecmp('personal30').zero?
      created_at + PERSONAL30_TRIAL_DAYS.days
    elsif account_type.to_s.casecmp('individual').zero?
      created_at + INDIVIDUAL_TRIAL_DAYS.days
    end
  end

  def remaining_days_deletion
    return nil unless state == STATE_LOCKED
    begin
      deletion_date = Cartodb::Central.new.get_user(username).fetch('scheduled_deletion_date', nil)
      return nil unless deletion_date
      (deletion_date.to_date - Date.today).to_i
    rescue StandardError => e
      CartoDB::Logger.warning(exception: e, message: 'Something went wrong calculating the number of remaining days for account deletion')
      return nil
    end
  end

  def viewable_by?(viewer)
    id == viewer.id || organization.try(:admin?, viewer)
  end

  def editable_by?(user)
    id == user.id || user.belongs_to_organization?(organization) && (user.organization_owner? || !organization_admin?)
  end

  # Some operations, such as user deletion, won't ask for password confirmation if password is not set (because of Google sign in, for example)
  def needs_password_confirmation?
    (!oauth_signin? || !last_password_change_date.nil?) &&
      !created_with_http_authentication? &&
      !organization.try(:auth_saml_enabled?)
  end

  def validate_old_password(old_password)
    return true unless needs_password_confirmation?

    Carto::Common::EncryptionService.verify(password: old_password, secure_password: crypted_password,
                                            secret: Cartodb.config[:password_secret])
  end

  def valid_password_confirmation(password)
    valid = validate_old_password(password)
    errors.add(:password, 'Confirmation password sent does not match your current password') unless valid
    valid
  end

  def valid_password?(key, value, confirmation_value)
    password_validator.validate(value, confirmation_value, self).each { |e| errors.add(key, e) }
    validate_password_not_in_use(nil, value, key)

    errors[key].empty?
  end

  def validate_password_not_in_use(old_password = nil, new_password = nil, key = :new_password)
    if password_in_use?(old_password, new_password)
      errors.add(key, 'New password cannot be the same as old password')
    end
    errors[key].empty?
  end

  def password_in_use?(old_password = nil, new_password = nil)
    return false if new_record?
    return old_password == new_password if old_password

    Carto::Common::EncryptionService.verify(password: new_password, secure_password: crypted_password_was,
                                            secret: Cartodb.config[:password_secret])
  end

  alias_method :should_display_old_password?, :needs_password_confirmation?
  alias_method :password_set?, :needs_password_confirmation?

  def oauth_signin?
    google_sign_in || github_user_id.present?
  end

  def created_with_http_authentication?
    Carto::UserCreation.http_authentication.find_by_user_id(id).present?
  end

  def organization_owner?
    organization && organization.owner_id == id
  end

  def organization_admin?
    organization_user? && (organization_owner? || org_admin)
  end

  def mobile_sdk_enabled?
    mobile_max_open_users > 0 || mobile_max_private_users > 0
  end

  def get_auth_tokens
    tokens = [get_auth_token]

    if has_organization?
      tokens << organization.get_auth_token
      tokens += groups.map(&:get_auth_token)
    end

    tokens
  end

  def get_auth_token
    # Circumvent DEFAULT_SELECT, didn't add auth_token there for sercurity (presenters, etc)
    auth_token = Carto::User.select(:auth_token).find(id).auth_token

    auth_token || generate_and_save_auth_token
  end

  def notifications_for_category(category)
    static_notifications.notifications[category] || {}
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

  def can_change_email?
    (!google_sign_in || last_password_change_date.present?) && !Carto::Ldap::Manager.new.configuration_present?
  end

  def can_change_password?
    !Carto::Ldap::Manager.new.configuration_present?
  end

  def view_dashboard
    update_column(:dashboard_viewed_at, Time.now)
  end

  # Special url that goes to Central if active (for old dashboard only)
  def account_url(request_protocol)
    request_protocol + CartoDB.account_host + CartoDB.account_path + '/' + username if CartoDB.account_host
  end

  # Special url that goes to Central if active
  def plan_url(request_protocol)
    account_url(request_protocol) + '/plan'
  end

  def relevant_frontend_version
    frontend_version || CartoDB::Application.frontend_version
  end

  def cant_be_deleted_reason
    if organization_owner?
      "You can't delete your account because you are admin of an organization"
    elsif Carto::UserCreation.http_authentication.where(user_id: id).first.present?
      "You can't delete your account because you are using HTTP Header Authentication"
    end
  end

  # Gets the list of OAuth accounts the user has (currently only used for synchronization)
  # @return CartoDB::OAuths
  def oauths
    @oauths ||= CartoDB::OAuths.new(self)
  end

  def get_oauth_services
    datasources = CartoDB::Datasources::DatasourcesFactory.get_all_oauth_datasources
    array = []

    datasources.each do |serv|
      obj ||= Hash.new

      title = ::User::OAUTH_SERVICE_TITLES.fetch(serv, serv)
      revoke_url = ::User::OAUTH_SERVICE_REVOKE_URLS.fetch(serv, nil)
      enabled = case serv
                when 'gdrive'
                  Cartodb.config[:oauth][serv]['client_id'].present?
                when 'box'
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

  def active?
    state == STATE_ACTIVE
  end

  def locked?
    state == STATE_LOCKED
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

  def send_password_reset!
    generate_token(:password_reset_token)
    self.password_reset_sent_at = Time.zone.now
    save!

    Resque.enqueue(::Resque::UserJobs::Mail::PasswordReset, id)
  end

  def multifactor_authentication_configured?
    user_multifactor_auths.any?
  end

  def active_multifactor_authentication
    user_multifactor_auths.order(created_at: :desc).first
  end

  def multifactor_authentication_status
    if user_multifactor_auths.setup.any?
      MULTIFACTOR_AUTHENTICATION_NEEDS_SETUP
    elsif user_multifactor_auths.enabled.any?
      MULTIFACTOR_AUTHENTICATION_ENABLED
    else
      MULTIFACTOR_AUTHENTICATION_DISABLED
    end
  end

  def remaining_trial_days
    return 0 unless trial_ends_at
    ((trial_ends_at - Time.now) / 1.day).round
  end

  def trial_user?
    TRIAL_PLANS.include?(account_type.to_s.downcase)
  end

  def get_database_roles
    api_key_roles = api_keys.reject { |k| k.db_role =~ /^publicuser/ }.map(&:db_role)
    oauth_app_owner_roles = api_keys.reject { |k| k.effective_ownership_role_name == nil }.map(&:effective_ownership_role_name)
    (api_key_roles + oauth_app_owner_roles).uniq
  end

  private

  def password_rate_limit_configured?
    @max_burst ||= Cartodb.get_config(:passwords, 'rate_limit', 'max_burst')
    @count ||= Cartodb.get_config(:passwords, 'rate_limit', 'count')
    @period ||= Cartodb.get_config(:passwords, 'rate_limit', 'period')

    [@max_burst, @count, @period].all?(&:present?)
  end

  def set_database_host
    self.database_host ||= ::SequelRails.configuration.environment_for(Rails.env)['host']
  end

  def generate_api_key
    self.api_key ||= make_token
  end

  def generate_token(column)
    begin
      self[column] = SecureRandom.urlsafe_base64
    end while Carto::User.exists?(column => self[column])
  end

  def ds_metrics_parameters_from_options(options)
    date_from = (options[:from] ? options[:from].to_date : last_billing_cycle)
    date_to = (options[:to] ? options[:to].to_date : Date.today)
    orgwise = options.fetch(:orgwise, true)
    [date_from, date_to, orgwise]
  end

  def make_token
    Carto::Common::EncryptionService.make_token
  end
end

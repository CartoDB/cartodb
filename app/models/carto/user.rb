require 'active_record'
require 'cartodb-common'
require 'securerandom'
require_relative 'user_service'
require_relative 'user_db_service'
require_relative 'synchronization_oauth'
require_relative '../../helpers/data_services_metrics_helper'
require_dependency 'carto/helpers/auth_token_generator'
require_dependency 'carto/helpers/user_commons'

# TODO: This probably has to be moved as the service of the proper User Model
class Carto::User < ActiveRecord::Base
  extend Forwardable
  include DataServicesMetricsHelper
  include Carto::AuthTokenGenerator
  include Carto::UserCommons

  # INFO: select filter is done for security and performance reasons. Add new columns if needed.
  DEFAULT_SELECT = "users.email, users.username, users.admin, users.organization_id, users.id, users.avatar_url," \
                   "users.api_key, users.database_schema, users.database_name, users.name, users.location," \
                   "users.disqus_shortname, users.account_type, users.twitter_username, users.google_maps_key, " \
                   "users.viewer, users.quota_in_bytes, users.database_host, users.crypted_password, " \
                   "users.builder_enabled, users.private_tables_enabled, users.private_maps_enabled, " \
                   "users.org_admin, users.last_name, users.google_maps_private_key, users.website, " \
                   "users.description, users.available_for_hire, users.frontend_version, users.asset_host, "\
                   "users.no_map_logo, users.industry, users.company, users.phone, users.job_role, "\
                   "users.public_map_quota, users.public_dataset_quota, users.private_map_quota, "\
                   "users.maintenance_mode, users.company_employees, users.use_case, users.session_salt".freeze

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
  has_many :dbdirect_certificates, inverse_of: :user, dependent: :destroy
  has_one  :dbdirect_ip, inverse_of: :user, dependent: :destroy

  has_many :oauth_apps, inverse_of: :user, dependent: :destroy
  has_many :oauth_app_users, inverse_of: :user, dependent: :destroy
  has_many :granted_oauth_apps, through: :oauth_app_users, class_name: Carto::OauthApp, source: 'oauth_app'

  delegate [
    :database_username, :database_password, :in_database,
    :db_size_in_bytes, :get_api_calls, :table_count, :public_visualization_count, :all_visualization_count,
    :visualization_count, :owned_visualization_count, :twitter_imports_count,
    :link_privacy_visualization_count, :password_privacy_visualization_count, :public_privacy_visualization_count,
    :private_privacy_visualization_count
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
  before_create :generate_session_salt

  after_save { reset_password_rate_limit if crypted_password_changed? }

  after_destroy { rate_limit.destroy_completely(self) if rate_limit }
  after_destroy :invalidate_varnish_cache

  # Auto creates notifications on first access
  def static_notifications_with_creation
    static_notifications_without_creation || build_static_notifications(user: self, notifications: {})
  end
  alias_method_chain :static_notifications, :creation

  def password=(value)
    return if !value.nil? && password_validator.validate(value, value, self).any?

    @password = value
    self.crypted_password = Carto::Common::EncryptionService.encrypt(password: value,
                                                                     secret: Cartodb.config[:password_secret])
  end

  def password_confirmation=(password_confirmation)
    # TODO: Implement
  end

  def invalidate_all_sessions!
    user = ::User.where(id: self.id).first
    user&.invalidate_all_sessions!
  end

  def default_avatar
    "cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png"
  end

  # TODO: Revisit methods below to delegate to the service, many look like not proper of the model itself

  def service
    @service ||= Carto::UserService.new(self)
  end

  def db_service
    @db_service ||= Carto::UserDBService.new(self)
  end

  def default_dataset_privacy
    Carto::UserTable::PRIVACY_VALUES_TO_TEXTS[default_table_privacy]
  end

  def default_table_privacy
    private_tables_enabled ? Carto::UserTable::PRIVACY_PRIVATE : Carto::UserTable::PRIVACY_PUBLIC
  end

  def feature_flags_list
    ffs = feature_flags_user + (organization&.inheritable_feature_flags || [])
    @feature_flag_names = (ffs
                                 .map { |ff| ff.feature_flag.name } + FeatureFlag.where(restricted: false)
                                                                                 .map(&:name)).uniq.sort
  end

  def has_feature_flag?(feature_flag_name)
    feature_flags_list.present? && feature_flags_list.include?(feature_flag_name)
  end

  def twitter_datasource_enabled
    (read_attribute(:twitter_datasource_enabled) || organization.try(&:twitter_datasource_enabled)) && twitter_configured?
  end

  def google_maps_private_key
    if organization.try(:google_maps_private_key).blank?
      read_attribute(:google_maps_private_key)
    else
      organization.google_maps_private_key
    end
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

  def password_in_use?(old_password = nil, new_password = nil)
    return false if new_record?
    return old_password == new_password if old_password

    Carto::Common::EncryptionService.verify(password: new_password, secure_password: crypted_password_was,
                                            secret: Cartodb.config[:password_secret])
  end

  alias_method :should_display_old_password?, :needs_password_confirmation?
  alias_method :password_set?, :needs_password_confirmation?

  def get_auth_token
    # Circumvent DEFAULT_SELECT, didn't add auth_token there for sercurity (presenters, etc)
    auth_token = Carto::User.select(:auth_token).find(id).auth_token

    auth_token || generate_and_save_auth_token
  end

  def notifications_for_category(category)
    static_notifications.notifications[category] || {}
  end

  def view_dashboard
    update_column(:dashboard_viewed_at, Time.now)
  end

  def send_password_reset!
    generate_token(:password_reset_token)
    self.password_reset_sent_at = Time.zone.now
    save!

    Resque.enqueue(::Resque::UserJobs::Mail::PasswordReset, id)
  end

  def dbdirect_effective_ips
    dbdirect_effective_ip&.ips || []
  end

  def dbdirect_effective_ips=(ips)
    ips ||= []
    bearer = dbdirect_bearer
    if bearer.dbdirect_ip
      bearer.dbdirect_ip.update!(ips: ips)
    else
      bearer.create_dbdirect_ip!(ips: ips)
    end
  end

  def dbdirect_effective_ip
    dbdirect_bearer.dbdirect_ip
  end

  def dbdirect_bearer
    if organization.present? && organization.owner != self
      organization.owner.reload
    else
      reload
    end
  end

  private

  def set_database_host
    self.database_host ||= ::SequelRails.configuration.environment_for(Rails.env)['host']
  end

  def generate_api_key
    self.api_key ||= make_token
  end

  def generate_session_salt
    self.session_salt ||= SecureRandom.hex
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
end

# encoding: UTF-8

require 'active_record'
require_relative 'user_service'
require_relative 'user_db_service'
require_relative 'synchronization_oauth'
require_relative '../../helpers/data_services_metrics_helper'

# TODO: This probably has to be moved as the service of the proper User Model
class Carto::User < ActiveRecord::Base
  extend Forwardable
  include DataServicesMetricsHelper

  MIN_PASSWORD_LENGTH = 6
  MAX_PASSWORD_LENGTH = 64
  GEOCODING_BLOCK_SIZE = 1000
  HERE_ISOLINES_BLOCK_SIZE = 1000
  OBS_SNAPSHOT_BLOCK_SIZE = 1000

  # INFO: select filter is done for security and performance reasons. Add new columns if needed.
  DEFAULT_SELECT = "users.email, users.username, users.admin, users.organization_id, users.id, users.avatar_url," +
                   "users.api_key, users.database_schema, users.database_name, users.name, users.location," +
                   "users.disqus_shortname, users.account_type, users.twitter_username, users.google_maps_key"

  SELECT_WITH_DATABASE = DEFAULT_SELECT + ", users.quota_in_bytes, users.database_host"

  has_many :tables, class_name: Carto::UserTable, inverse_of: :user
  has_many :visualizations, inverse_of: :user
  has_many :maps, inverse_of: :user
  has_many :layers_user
  has_many :layers, through: :layers_user

  belongs_to :organization, inverse_of: :users
  has_one :owned_organization, class_name: Carto::Organization, inverse_of: :owner, foreign_key: :owner_id

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

  has_many :client_applications, class_name: Carto::ClientApplication
  has_many :oauth_tokens, class_name: Carto::OauthToken

  has_many :users_group, dependent: :destroy, class_name: Carto::UsersGroup
  has_many :groups, through: :users_group

  delegate [:database_username, :database_password, :in_database,
            :db_size_in_bytes, :get_api_calls, :table_count,
            :public_visualization_count, :all_visualization_count, :visualization_count,
            :twitter_imports_count] => :service

  attr_reader :password

  # TODO: From sequel, can be removed once finished
  alias_method :maps_dataset, :maps
  alias_method :layers_dataset, :layers
  alias_method :assets_dataset, :assets
  alias_method :data_imports_dataset, :data_imports
  alias_method :geocodings_dataset, :geocodings

  def name_or_username
    name.present? ? name : username
  end

  def password=(value)
    return if !value.nil? && (value.length < MIN_PASSWORD_LENGTH || value.length >= MAX_PASSWORD_LENGTH)

    @password = value

    service_class = service.class
    self.salt = new_record? ? service_class.make_token : ::User.filter(id: id).select(:salt).first.salt
    self.crypted_password = service_class.password_digest(value, salt)
  end

  def password_confirmation=(_password_confirmation)
    # TODO: Implement
  end

  def default_avatar
    "cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png"
  end

  def feature_flag_names
    @feature_flag_names ||= (feature_flags_user.map { |ff| ff.feature_flag.name } +
                             FeatureFlag.where(restricted: false).map(&:name))
                            .uniq
                            .sort
  end

  def has_feature_flag?(feature_flag_name)
    feature_flags_names.present? && feature_flags_names.include?(feature_flag_name)
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
    private_tables_enabled || privacy == UserTable::PRIVACY_PUBLIC
  end

  # @return String public user url, which is also the base url for a given user
  def public_url(subdomain_override = nil, protocol_override = nil)
    CartoDB.base_url(subdomain_override ? subdomain : subdomain_override, organization_username, protocol_override)
  end

  def subdomain
    if CartoDB.subdomainless_urls?
      username
    else
      organization ? username : organization.name
    end
  end

  def has_organization?
    !!organization_id
  end

  def avatar
    avatar_url ? "//#{default_avatar}" : avatar_url
  end

  def remove_logo?
    Carto::AccountType.new.remove_logo?(self)
  end

  def organization_username
    CartoDB.subdomainless_urls? || !organization ? nil : username
  end

  def sql_safe_database_schema
    database_schema.include?('-') ? "\"#{database_schema}\"" : database_schema
  end

  # returns google maps api key. If the user is in an organization and
  # that organization has api key it's used
  def google_maps_api_key
    if has_organization?
      self.organization.google_maps_key || self.google_maps_key
    else
      self.google_maps_key
    end
  end

  def twitter_datasource_enabled
    if has_organization?
      organization.twitter_datasource_enabled || read_attribute(:twitter_datasource_enabled)
    else
      read_attribute(:twitter_datasource_enabled)
    end
  end

  # TODO: this is the correct name for what's stored in the model, refactor changing that name
  alias_method :google_maps_query_string, :google_maps_api_key

  # Returns the google maps private key. If the user is in an organization and
  # that organization has a private key, the org's private key is returned.
  def google_maps_private_key
    if has_organization?
      organization.google_maps_private_key || read_attribute(:google_maps_private_key)
    else
      read_attribute(:google_maps_private_key)
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

  def remaining_geocoding_quota(options = {})
    if organization.present?
      remaining = organization.remaining_geocoding_quota(options)
    else
      remaining = geocoding_quota - get_geocoding_calls(options)
    end
    (remaining > 0 ? remaining : 0)
  end

  def remaining_here_isolines_quota(options = {})
    if organization.present?
      remaining = organization.remaining_here_isolines_quota(options)
    else
      remaining = here_isolines_quota - get_here_isolines_calls(options)
    end
    (remaining > 0 ? remaining : 0)
  end

  def remaining_obs_snapshot_quota(options = {})
    if organization.present?
      remaining = organization.remaining_obs_snapshot_quota(options)
    else
      remaining = obs_snapshot_quota - get_obs_snapshot_calls(options)
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
    #synchronization_oauths.create(
    #    service:  service,
    #    token:    token
    #)
    # INFO: even this fails eventually, th the same error. See https://github.com/CartoDB/cartodb/issues/4003
    synchronization_oauth = Carto::SynchronizationOauth.new({
      user_id: self.id,
      service: service,
      token: token
    })
    synchronization_oauth.save
    synchronization_oauths.append(synchronization_oauth)
    synchronization_oauth
  end

  def last_billing_cycle
    day = period_end_date.day rescue 29.days.ago.day
    date = (day > Date.today.day ? (Date.today - 1.month) : Date.today)
    begin
      Date.parse("#{date.year}-#{date.month}-#{day}")
    rescue ArgumentError
      day = day - 1
      retry
    end
  end

  def get_geocoding_calls(options = {})
    date_to = (options[:to] ? options[:to].to_date : Date.today)
    date_from = (options[:from] ? options[:from].to_date : last_billing_cycle)
    if has_feature_flag?('new_geocoder_quota')
      get_user_geocoding_data(self, date_from, date_to)
    else
      self.geocodings.where(kind: 'high-resolution').where('created_at >= ? and created_at <= ?', date_from, date_to + 1.days)
        .sum("processed_rows + cache_hits".lit).to_i
    end
  end

  def get_new_system_geocoding_calls(options = {})
    date_to = (options[:to] ? options[:to].to_date : Date.current)
    date_from = (options[:from] ? options[:from].to_date : last_billing_cycle)
    get_user_geocoding_data(self, date_from, date_to)
  end

  def get_here_isolines_calls(options = {})
    date_to = (options[:to] ? options[:to].to_date : Date.today)
    date_from = (options[:from] ? options[:from].to_date : last_billing_cycle)
    get_user_here_isolines_data(self, date_from, date_to)
  end

  def get_obs_snapshot_calls(options = {})
    date_to = (options[:to] ? options[:to].to_date : Date.today)
    date_from = (options[:from] ? options[:from].to_date : last_billing_cycle)
    get_user_obs_snapshot_data(self, date_from, date_to)
  end

  #TODO: Remove unused param `use_total`
  def remaining_quota(use_total = false, db_size = service.db_size_in_bytes)
    self.quota_in_bytes - db_size
  end

  #can be nil table quotas
  def remaining_table_quota
    if self.table_quota.present?
      remaining = self.table_quota - service.table_count
      (remaining < 0) ? 0 : remaining
    end
  end

  def organization_user?
    self.organization.present?
  end

  def belongs_to_organization?(organization)
    self.organization_user? && organization != nil && self.organization_id == organization.id
  end

  def soft_geocoding_limit?
    Carto::AccountType.new.soft_geocoding_limit?(self)
  end
  alias_method :soft_geocoding_limit, :soft_geocoding_limit?

  def hard_geocoding_limit?
    !self.soft_geocoding_limit?
  end
  alias_method :hard_geocoding_limit, :hard_geocoding_limit?

  def soft_here_isolines_limit?
    Carto::AccountType.new.soft_here_isolines_limit?(self)
  end
  alias_method :soft_here_isolines_limit, :soft_here_isolines_limit?

  def hard_here_isolines_limit?
    !self.soft_here_isolines_limit?
  end
  alias_method :hard_here_isolines_limit, :hard_here_isolines_limit?

  def soft_obs_snapshot_limit?
    Carto::AccountType.new.soft_obs_snapshot_limit?(self)
  end
  alias_method :soft_obs_snapshot_limit, :soft_obs_snapshot_limit?

  def hard_obs_snapshot_limit?
    !self.soft_obs_snapshot_limit?
  end
  alias_method :hard_obs_snapshot_limit, :hard_obs_snapshot_limit?

  def soft_twitter_datasource_limit?
    self.soft_twitter_datasource_limit  == true
  end

  def hard_twitter_datasource_limit?
    !self.soft_twitter_datasource_limit?
  end
  alias_method :hard_twitter_datasource_limit, :hard_twitter_datasource_limit?

  def trial_ends_at
    if self.account_type.to_s.downcase == 'magellan' && self.upgraded_at && self.upgraded_at + 15.days > Date.today
      self.upgraded_at + 15.days
    else
      nil
    end
  end

  def dedicated_support?
    Carto::AccountType.new.dedicated_support?(self)
  end

  def arcgis_datasource_enabled?
    self.arcgis_datasource_enabled == true
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

  # Some operations, such as user deletion, won't ask for password confirmation if password is not set (because of Google sign in, for example)
  def needs_password_confirmation?
    google_sign_in.nil? || !google_sign_in || !last_password_change_date.nil?
  end

  def organization_owner?
    organization && organization.owner_id == id
  end

  private

end

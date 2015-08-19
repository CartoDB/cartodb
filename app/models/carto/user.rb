# encoding: UTF-8

require 'active_record'
require_relative 'user_service'
require_relative 'synchronization_oauth'

# TODO: This probably has to be moved as the service of the proper User Model
class Carto::User < ActiveRecord::Base
  extend Forwardable

  MIN_PASSWORD_LENGTH = 6
  GEOCODING_BLOCK_SIZE = 1000

  has_many :tables, class_name: 'Carto::UserTable', inverse_of: :user
  has_many :visualizations, inverse_of: :user
  has_many :maps, inverse_of: :user
  has_many :layers_user
  has_many :layers, :through => :layers_user
  belongs_to :organization, inverse_of: :users
  has_many :feature_flags_user, dependent: :destroy
  has_many :assets, inverse_of: :user
  has_many :data_imports, inverse_of: :user
  has_many :geocodings, inverse_of: :user
  has_many :synchronization_oauths, class_name: Carto::SynchronizationOauth, inverse_of: :user, dependent: :destroy
  has_many :search_tweets, inverse_of: :user
  has_many :synchronizations, inverse_of: :user

  delegate [ 
      :database_username, :database_password, :in_database, :load_cartodb_functions, :rebuild_quota_trigger,
      :db_size_in_bytes, :get_api_calls, :table_count, :public_visualization_count, :visualization_count,
      :twitter_imports_count
    ] => :service

  # INFO: select filter is done for security and performance reasons. Add new columns if needed.
  DEFAULT_SELECT = "users.email, users.username, users.admin, users.organization_id, users.id, users.avatar_url," + 
                   "users.api_key, users.database_schema, users.database_name, users.name," +
                   "users.disqus_shortname, users.account_type, users.twitter_username, users.google_maps_key"

  SELECT_WITH_DATABASE = DEFAULT_SELECT + ", users.quota_in_bytes, users.database_host"

  attr_reader :password

  # TODO: From sequel, can be removed once finished
  alias_method :maps_dataset, :maps
  alias_method :layers_dataset, :layers
  alias_method :assets_dataset, :assets
  alias_method :data_imports_dataset, :data_imports
  alias_method :geocodings_dataset, :geocodings

  def name_or_username
    self.name.present? ? self.name : self.username
  end

  def password=(value)
    return if !value.nil? && value.length < MIN_PASSWORD_LENGTH

    @password = value
    self.salt = new_record? ? service.class.make_token : User.filter(:id => self.id).select(:salt).first.salt
    self.crypted_password = service.class.password_digest(value, salt)
  end

  def password_confirmation=(password_confirmation)
    # TODO: Implement
  end

  def default_avatar
    return "cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png"
  end

  def feature_flag_names
    @feature_flag_names ||= (self.feature_flags_user.map { |ff| 
                                                            ff.feature_flag.name 
                                                          } + 
                            FeatureFlag.where(restricted: false).map { |ff| 
                                                                        ff.name 
                                                                      }).uniq.sort
  end

  # TODO: Revisit methods below to delegate to the service, many look like not proper of the model itself

  def service
    @service ||= Carto::UserService.new(self)
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

  # @return String public user url, which is also the base url for a given user
  def public_url(subdomain_override=nil, protocol_override=nil)
    CartoDB.base_url(subdomain_override.nil? ? subdomain : subdomain_override, organization_username, protocol_override)
  end

  def subdomain
    if CartoDB.subdomainless_urls?
      username
    else
      organization.nil? ? username : organization.name
    end
  end

  def feature_flags_list
    @feature_flag_names ||= (self.feature_flags_user
                                 .map { |ff| ff.feature_flag.name } + FeatureFlag.where(restricted: false)
                                                                                 .map { |ff| ff.name }).uniq.sort
  end

  def has_feature_flag?(feature_flag_name)
    self.feature_flags_list.present? && self.feature_flags_list.include?(feature_flag_name)
  end

  def has_organization?
    !organization_id.nil?
  end

  def avatar
    self.avatar_url.nil? ? "//#{self.default_avatar}" : self.avatar_url
  end

  def remove_logo?
    /(FREE|MAGELLAN|JOHN SNOW|ACADEMY|ACADEMIC|ON HOLD)/i.match(self.account_type) ? false : true
  end

  def organization_username
    CartoDB.subdomainless_urls? || organization.nil? ? nil : username
  end

  def sql_safe_database_schema
    self.database_schema.include?('-') ? "\"#{self.database_schema}\"" : self.database_schema
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
    google_maps_enabled = !google_maps_api_key.blank?
    basemaps = Cartodb.config[:basemaps]
    if basemaps
      basemaps.select { |group| 
        g = group == 'GMaps'
        google_maps_enabled ? g : !g
      }
    end
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
      remaining = organization.geocoding_quota.to_i - organization.get_geocoding_calls(options)
    else
      remaining = geocoding_quota - get_geocoding_calls(options)
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
    self.geocodings.where(kind: 'high-resolution').where('created_at >= ? and created_at <= ?', date_from, date_to + 1.days)
      .sum("processed_rows + cache_hits".lit).to_i
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
    /(FREE|MAGELLAN|JOHN SNOW|ACADEMY|ACADEMIC|ON HOLD)/i.match(self.account_type) ? false : true
  end

  def remove_logo?
    /(FREE|MAGELLAN|JOHN SNOW|ACADEMY|ACADEMIC|ON HOLD)/i.match(self.account_type) ? false : true
  end

  def import_quota
    if self.max_concurrent_import_count.nil?
      self.account_type.downcase == 'free' ? 1 : 3
    else
      self.max_concurrent_import_count
    end
  end

  def arcgis_datasource_enabled?
    self.arcgis_datasource_enabled == true
  end

  def private_maps_enabled?
    flag_enabled = self.private_maps_enabled
    return true if flag_enabled.present? && flag_enabled == true

    #TODO: remove this after making sure we have flags inline with account types
    return true if not self.account_type.match(/FREE|MAGELLAN|JOHN SNOW|ACADEMY|ACADEMIC|ON HOLD/i)

    return true if self.private_tables_enabled # Note private_tables_enabled => private_maps_enabled
    return false
  end

end

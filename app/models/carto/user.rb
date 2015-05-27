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
  has_many :feature_flags, :through => :feature_flags_user
  has_many :assets, inverse_of: :user
  has_many :data_imports, inverse_of: :user
  has_many :geocodings, inverse_of: :user
  has_many :synchronization_oauths, class_name: Carto::SynchronizationOauth, inverse_of: :user, dependent: :destroy

  delegate [ 
      :database_username, :database_password, :in_database, :load_cartodb_functions, :rebuild_quota_trigger 
    ] => :service

  # INFO: select filter is done for security and performance reasons. Add new columns if needed.
  DEFAULT_SELECT = "users.email, users.username, users.admin, users.organization_id, users.id, users.avatar_url," + 
                   "users.api_key, users.dynamic_cdn_enabled, users.database_schema, users.database_name, users.name," +
                   "users.disqus_shortname, users.account_type, users.twitter_username, users.google_maps_key"

  attr_reader :password

  # TODO: From sequel, can be removed
  alias_method :maps_dataset, :maps
  alias_method :layers_dataset, :layers
  alias_method :assets_dataset, :assets
  alias_method :data_imports_dataset, :data_imports
  alias_method :geocodings_dataset, :geocodings


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

  # TODO: Revisit methods below to delegate to the service, many look like not proper of the model itself

  def service
    @service ||= Carto::UserService.new(self)
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
    "\"#{self.database_schema}\""
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
    geocoding_quota - get_geocoding_calls(options)
  end

  def oauth_for_service(service)
    synchronization_oauths.where(service: service).first
  end

  def add_oauth(service, token)
    synchronization_oauths.create(
        service:  service,
        token:    token
    )
  end

  private
  def get_geocoding_calls(options = {})
    date_to = (options[:to] ? options[:to].to_date : Date.today)
    date_from = (options[:from] ? options[:from].to_date : last_billing_cycle)
    self.geocodings.where(kind: 'high-resolution').where('created_at >= ? and created_at <= ?', date_from, date_to + 1.days)
      .sum("processed_rows + cache_hits".lit).to_i
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

end

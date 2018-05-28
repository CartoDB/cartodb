# encoding: utf-8

require_relative '../controllers/carto/api/group_presenter'
require_relative './organization/organization_decorator'
require_relative '../helpers/data_services_metrics_helper'
require_relative './permission'
require_dependency 'carto/helpers/auth_token_generator'
require_dependency 'common/organization_common'

class Organization < Sequel::Model

  class OrganizationWithoutOwner < StandardError
    attr_reader :organization

    def initialize(organization)
      @organization = organization
      super "Organization #{organization.name} has no owner"
    end
  end

  include CartoDB::OrganizationDecorator
  include Concerns::CartodbCentralSynchronizable
  include DataServicesMetricsHelper
  include Carto::AuthTokenGenerator
  include Carto::OrganizationSoftLimits

  Organization.raise_on_save_failure = true
  self.strict_param_setting = false

  # @param id String (uuid)
  # @param seats String
  # @param quota_in_bytes Integer
  # @param created_at Timestamp
  # @param updated_at Timestamp
  # @param name String
  # @param avatar_url String
  # @param website String
  # @param description String
  # @param display_name String
  # @param discus_shortname String
  # @param twitter_username String
  # @param location String
  # @param geocoding_quota Integer
  # @param map_view_quota Integer
  # @param geocoding_block_price Integer
  # @param map_view_block_price Integer

  one_to_many :users
  one_to_many :groups
  one_to_many :assets
  many_to_one :owner, class_name: '::User', key: 'owner_id'

  plugin :serialization, :json, :auth_saml_configuration

  plugin :validation_helpers

  DEFAULT_GEOCODING_QUOTA = 0
  DEFAULT_HERE_ISOLINES_QUOTA = 0
  DEFAULT_OBS_SNAPSHOT_QUOTA = 0
  DEFAULT_OBS_GENERAL_QUOTA = 0
  DEFAULT_MAPZEN_ROUTING_QUOTA = nil

  def default_password_expiration_in_d
    Cartodb.get_config(:passwords, 'expiration_in_d')
  end

  def validate
    super
    validates_presence [:name, :quota_in_bytes, :seats]
    validates_unique   :name
    validates_format   (/\A[a-z0-9\-]+\z/), :name, message: 'must only contain lowercase letters, numbers & hyphens'
    validates_integer  :default_quota_in_bytes, :allow_nil => true
    validates_integer :geocoding_quota, allow_nil: false, message: 'geocoding_quota cannot be nil'
    validates_integer :here_isolines_quota, allow_nil: false, message: 'here_isolines_quota cannot be nil'
    validates_integer :obs_snapshot_quota, allow_nil: false, message: 'obs_snapshot_quota cannot be nil'
    validates_integer :obs_general_quota, allow_nil: false, message: 'obs_general_quota cannot be nil'
    validate_password_expiration_in_d

    if default_quota_in_bytes
      errors.add(:default_quota_in_bytes, 'Default quota must be positive') if default_quota_in_bytes <= 0
    end
    errors.add(:name, 'cannot exist as user') if name_exists_in_users?
    if whitelisted_email_domains.present? && !auth_enabled?
      errors.add(:whitelisted_email_domains, 'enable at least one auth. system or clear whitelisted email domains')
    end

    errors.add(:seats, 'cannot be less than the number of builders') if seats && remaining_seats < 0
    errors.add(:viewer_seats, 'cannot be less than the number of viewers') if viewer_seats && remaining_viewer_seats < 0
  end

  def validate_password_expiration_in_d
    valid = password_expiration_in_d.blank? || password_expiration_in_d > 0 && password_expiration_in_d < 366
    errors.add(:password_expiration_in_d, 'must be greater than 0 and lower than 366') unless valid
  end

  def validate_for_signup(errors, user)
    validate_seats(user, errors)

    if !valid_disk_quota?(user.quota_in_bytes.to_i)
      errors.add(:quota_in_bytes, "not enough disk quota")
    end
  end

  def validate_seats(user, errors)
    if user.builder? && !valid_builder_seats?([user])
      errors.add(:organization, "not enough seats")
    end

    if user.viewer? && remaining_viewer_seats(excluded_users: [user]) <= 0
      errors.add(:organization, "not enough viewer seats")
    end
  end

  def valid_disk_quota?(quota = default_quota_in_bytes)
    unassigned_quota >= quota
  end

  def valid_builder_seats?(users = [])
    remaining_seats(excluded_users: users) > 0
  end

  def before_validation
    self.geocoding_quota ||= DEFAULT_GEOCODING_QUOTA
    self.here_isolines_quota ||= DEFAULT_HERE_ISOLINES_QUOTA
    self.obs_snapshot_quota ||= DEFAULT_OBS_SNAPSHOT_QUOTA
    self.obs_general_quota ||= DEFAULT_OBS_GENERAL_QUOTA
    self.mapzen_routing_quota ||= DEFAULT_MAPZEN_ROUTING_QUOTA
  end

  # Just to make code more uniform with user.database_schema
  def database_schema
    self.name
  end

  def before_save
    super
    @geocoding_quota_modified = changed_columns.include?(:geocoding_quota)
    @here_isolines_quota_modified = changed_columns.include?(:here_isolines_quota)
    @obs_snapshot_quota_modified = changed_columns.include?(:obs_snapshot_quota)
    @obs_general_quota_modified = changed_columns.include?(:obs_general_quota)
    @mapzen_routing_quota_modified = changed_columns.include?(:mapzen_routing_quota)
    self.updated_at = Time.now
    raise errors.join('; ') unless valid?
  end

  def before_destroy
    return false unless destroy_assets
    destroy_groups
  end

  def after_create
    super
    save_metadata
  end

  def after_save
    super
    save_metadata
  end

  # INFO: replacement for destroy because destroying owner triggers
  # organization destroy
  def destroy_cascade(delete_in_central: false)
    # This remains commented because we consider that enabling this for users at SaaS is unnecessary and risky.
    # Nevertheless, code remains, _just in case_. More info at https://github.com/CartoDB/cartodb/issues/12049
    # Central branch: 1764-Allow_updating_inactive_users
    # Central asks for usage information before deleting, so organization must be first deleted there
    # Corollary: you need multithreading for organization to work if you run Central
    # self.delete_in_central if delete_in_central

    destroy_groups
    destroy_non_owner_users
    if owner
      owner.destroy_cascade
    else
      destroy
    end
  end

  def destroy_non_owner_users
    non_owner_users.each do |user|
      user.ensure_nonviewer
      user.shared_entities.map(&:entity).uniq.each(&:delete)
      user.destroy_cascade
    end
  end

  def non_owner_users
    users.select { |u| owner && u.id != owner.id }
  end

  ##
  # SLOW! Checks redis data (geocoding and isolines) for every user in every organization
  # delta: get organizations who are also this percentage below their limit.
  #        example: 0.20 will get all organizations at 80% of their map view limit
  #
  def self.overquota(delta = 0)
    Organization.all.select do |o|
      begin
        limit = o.geocoding_quota.to_i - (o.geocoding_quota.to_i * delta)
        over_geocodings = o.get_geocoding_calls > limit
        limit = o.here_isolines_quota.to_i - (o.here_isolines_quota.to_i * delta)
        over_here_isolines = o.get_here_isolines_calls > limit
        limit = o.obs_snapshot_quota.to_i - (o.obs_snapshot_quota.to_i * delta)
        over_obs_snapshot = o.get_obs_snapshot_calls > limit
        limit = o.obs_general_quota.to_i - (o.obs_general_quota.to_i * delta)
        over_obs_general = o.get_obs_general_calls > limit
        limit = o.twitter_datasource_quota.to_i - (o.twitter_datasource_quota.to_i * delta)
        over_twitter_imports = o.get_twitter_imports_count > limit
        limit = o.mapzen_routing_quota.to_i - (o.mapzen_routing_quota.to_i * delta)
        over_mapzen_routing = o.get_mapzen_routing_calls > limit
        over_geocodings || over_twitter_imports || over_here_isolines || over_obs_snapshot || over_obs_general || over_mapzen_routing
      rescue OrganizationWithoutOwner => error
        # Avoid aborting because of inconistent organizations; just omit them
        CartoDB::Logger.error(
          message: 'Skipping organization without owner in overquota report',
          organization: name,
          exception: error
        )
        false
      end
    end
  end

  def get_api_calls(options = {})
    users.map{ |u| u.get_api_calls(options).sum }.sum
  end

  def get_geocoding_calls(options = {})
    require_organization_owner_presence!
    date_from, date_to = quota_dates(options)
    get_organization_geocoding_data(self, date_from, date_to)
  end

  def get_here_isolines_calls(options = {})
    date_from, date_to = quota_dates(options)
    get_organization_here_isolines_data(self, date_from, date_to)
  end

  def get_obs_snapshot_calls(options = {})
    date_from, date_to = quota_dates(options)
    get_organization_obs_snapshot_data(self, date_from, date_to)
  end

  def get_obs_general_calls(options = {})
    date_from, date_to = quota_dates(options)
    get_organization_obs_general_data(self, date_from, date_to)
  end

  def get_twitter_imports_count(options = {})
    date_from, date_to = quota_dates(options)

    SearchTweet.get_twitter_imports_count(users_dataset.join(:search_tweets, :user_id => :id), date_from, date_to)
  end

  def get_mapzen_routing_calls(options = {})
    date_from, date_to = quota_dates(options)
    get_organization_mapzen_routing_data(self, date_from, date_to)
  end

  def remaining_geocoding_quota
    remaining = geocoding_quota - get_geocoding_calls
    (remaining > 0 ? remaining : 0)
  end

  def remaining_here_isolines_quota
    remaining = here_isolines_quota - get_here_isolines_calls
    (remaining > 0 ? remaining : 0)
  end

  def remaining_obs_snapshot_quota
    remaining = obs_snapshot_quota - get_obs_snapshot_calls
    (remaining > 0 ? remaining : 0)
  end

  def remaining_obs_general_quota
    remaining = obs_general_quota - get_obs_general_calls
    (remaining > 0 ? remaining : 0)
  end

  def remaining_twitter_quota
    remaining = twitter_datasource_quota - get_twitter_imports_count
    (remaining > 0 ? remaining : 0)
  end

  def remaining_mapzen_routing_quota
    remaining = mapzen_routing_quota.to_i - get_mapzen_routing_calls
    (remaining > 0 ? remaining : 0)
  end

  def db_size_in_bytes
    users.map(&:db_size_in_bytes).sum.to_i
  end

  def assigned_quota
    users_dataset.sum(:quota_in_bytes).to_i
  end

  def unassigned_quota
    quota_in_bytes - assigned_quota
  end

  def to_poro
    {
      created_at:       created_at,
      description:      description,
      discus_shortname: discus_shortname,
      display_name:     display_name,
      id:               id,
      name:             name,
      owner: {
        id:         owner ? owner.id : nil,
        username:   owner ? owner.username : nil,
        avatar_url: owner ? owner.avatar_url : nil,
        email:      owner ? owner.email : nil,
        groups:     owner && owner.groups ? owner.groups.map { |g| Carto::Api::GroupPresenter.new(g).to_poro } : []
      },
      admins:                    users.select(&:org_admin).map { |u| { id: u.id } },
      quota_in_bytes:            quota_in_bytes,
      unassigned_quota:          unassigned_quota,
      geocoding_quota:           geocoding_quota,
      map_view_quota:            map_view_quota,
      twitter_datasource_quota:  twitter_datasource_quota,
      map_view_block_price:      map_view_block_price,
      geocoding_block_price:     geocoding_block_price,
      here_isolines_quota:       here_isolines_quota,
      here_isolines_block_price: here_isolines_block_price,
      obs_snapshot_quota:        obs_snapshot_quota,
      obs_snapshot_block_price:  obs_snapshot_block_price,
      obs_general_quota:         obs_general_quota,
      obs_general_block_price:   obs_general_block_price,
      geocoder_provider:         geocoder_provider,
      isolines_provider:         isolines_provider,
      routing_provider:          routing_provider,
      mapzen_routing_quota:       mapzen_routing_quota,
      mapzen_routing_block_price: mapzen_routing_block_price,
      seats:                     seats,
      twitter_username:          twitter_username,
      location:                  twitter_username,
      updated_at:                updated_at,
      website:                   website,
      admin_email:               admin_email,
      avatar_url:                avatar_url,
      user_count:                users.count,
      password_expiration_in_d:  password_expiration_in_d
    }
  end

  def public_visualizations(page_num = 1, items_per_page = 5, tag = nil)
    public_vis_by_type(CartoDB::Visualization::Member::TYPE_DERIVED, page_num, items_per_page, tag)
  end

  def public_visualizations_count
    public_vis_count_by_type(CartoDB::Visualization::Member::TYPE_DERIVED)
  end

  def public_datasets(page_num = 1, items_per_page = 5, tag = nil)
    public_vis_by_type(CartoDB::Visualization::Member::TYPE_CANONICAL, page_num, items_per_page, tag)
  end

  def public_datasets_count
    public_vis_count_by_type(CartoDB::Visualization::Member::TYPE_CANONICAL)
  end

  def tags(type, exclude_shared=true)
    users.map { |u| u.tags(exclude_shared, type) }.flatten
  end

  def public_vis_by_type(type, page_num, items_per_page, tags, order = 'updated_at', version = nil)
    CartoDB::Visualization::Collection.new.fetch(
        user_id:  self.users.map(&:id),
        type:     type,
        privacy:  CartoDB::Visualization::Member::PRIVACY_PUBLIC,
        page:     page_num,
        per_page: items_per_page,
        tags:     tags,
        order:    order,
        o:        { updated_at: :desc },
        version:  version
    )
  end

  def signup_page_enabled
    whitelisted_email_domains.present? && auth_enabled?
  end

  def auth_enabled?
    auth_username_password_enabled || auth_google_enabled || auth_github_enabled || auth_saml_enabled?
  end

  def total_seats
    seats + viewer_seats
  end

  def remaining_seats(excluded_users: [])
    seats - assigned_seats(excluded_users: excluded_users)
  end

  def remaining_viewer_seats(excluded_users: [])
    viewer_seats - assigned_viewer_seats(excluded_users: excluded_users)
  end

  def assigned_seats(excluded_users: [])
    builder_users.count { |u| !excluded_users.map(&:id).include?(u.id) }
  end

  def assigned_viewer_seats(excluded_users: [])
    viewer_users.count { |u| !excluded_users.map(&:id).include?(u.id) }
  end

  def builder_users
    (users || []).select(&:builder?)
  end

  def viewer_users
    (users || []).select(&:viewer?)
  end

  def admin?(user)
    user.belongs_to_organization?(self) && user.organization_admin?
  end

  def notify_if_disk_quota_limit_reached
    ::Resque.enqueue(::Resque::OrganizationJobs::Mail::DiskQuotaLimitReached, id) if disk_quota_limit_reached?
  end

  def notify_if_seat_limit_reached
    ::Resque.enqueue(::Resque::OrganizationJobs::Mail::SeatLimitReached, id) if seat_limit_reached?
  end

  def database_name
    owner ? owner.database_name : nil
  end

  def revoke_cdb_conf_access
    return unless users
    users.map { |user| user.db_service.revoke_cdb_conf_access }
  end

  def name_to_display
    display_name.nil? ? name : display_name
  end

  # create the key that is used in redis
  def key
    "rails:orgs:#{name}"
  end

  # save orgs basic metadata to redis for other services (node sql api, geocoder api, etc)
  # to use
  def save_metadata
    $users_metadata.HMSET key,
      'id', id,
      'geocoding_quota', geocoding_quota,
      'here_isolines_quota', here_isolines_quota,
      'obs_snapshot_quota', obs_snapshot_quota,
      'obs_general_quota', obs_general_quota,
      'mapzen_routing_quota', mapzen_routing_quota,
      'google_maps_client_id', google_maps_key,
      'google_maps_api_key', google_maps_private_key,
      'period_end_date', period_end_date,
      'geocoder_provider', geocoder_provider,
      'isolines_provider', isolines_provider,
      'routing_provider', routing_provider
  end

  def require_organization_owner_presence!
    if owner.nil?
      raise Organization::OrganizationWithoutOwner.new(self)
    end
  end

  def max_import_file_size
    owner ? owner.max_import_file_size : ::User::DEFAULT_MAX_IMPORT_FILE_SIZE
  end

  def max_import_table_row_count
    owner ? owner.max_import_table_row_count : ::User::DEFAULT_MAX_IMPORT_TABLE_ROW_COUNT
  end

  def max_concurrent_import_count
    owner ? owner.max_concurrent_import_count : ::User::DEFAULT_MAX_CONCURRENT_IMPORT_COUNT
  end

  def max_layers
    owner ? owner.max_layers : ::User::DEFAULT_MAX_LAYERS
  end

  def auth_saml_enabled?
    auth_saml_configuration.present?
  end

  private

  def destroy_assets
    assets.map { |asset| Carto::Asset.find(asset.id) }.map(&:destroy).all?
  end

  def destroy_groups
    return unless groups

    groups.map { |g| Carto::Group.find(g.id).destroy_group_with_extension }

    reload
  end

  # Returns true if disk quota won't allow new signups with existing defaults
  def disk_quota_limit_reached?
    unassigned_quota < default_quota_in_bytes
  end

  # Returns true if seat limit will be reached with new user
  def seat_limit_reached?
    (remaining_seats - 1) < 1
  end

  def quota_dates(options)
    date_to = (options[:to] ? options[:to].to_date : Date.today)
    date_from = (options[:from] ? options[:from].to_date : last_billing_cycle)
    return date_from, date_to
  end

  def last_billing_cycle
    owner ? owner.last_billing_cycle : Date.today
  end

  def period_end_date
    owner ? owner.period_end_date : nil
  end

  def public_vis_count_by_type(type)
    CartoDB::Visualization::Collection.new.fetch(
        user_id:  self.users.map(&:id),
        type:     type,
        privacy:  CartoDB::Visualization::Member::PRIVACY_PUBLIC,
        per_page: CartoDB::Visualization::Collection::ALL_RECORDS
    ).count
  end

  def name_exists_in_users?
    !::User.where(username: self.name).first.nil?
  end
end

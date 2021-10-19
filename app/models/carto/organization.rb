require 'active_record'
require_relative '../../helpers/data_services_metrics_helper'
require_dependency 'carto/helpers/auth_token_generator'
require_dependency 'carto/carto_json_serializer'
require_dependency 'carto/helpers/organization_commons'

module Carto
  class Organization < ActiveRecord::Base

    include CartodbCentralSynchronizable
    include DataServicesMetricsHelper
    include Carto::OrganizationQuotas
    include AuthTokenGenerator
    include OrganizationSoftLimits
    include Carto::OrganizationCommons

    belongs_to :owner, class_name: 'Carto::User', inverse_of: :owned_organization
    has_many :users, -> { order(:username) }, inverse_of: :organization
    has_many :groups, -> { order(:display_name) }, inverse_of: :organization
    has_many :assets, class_name: 'Carto::Asset', dependent: :destroy, inverse_of: :organization
    has_many :notifications, -> { order('created_at DESC') }, dependent: :destroy
    has_many :connector_configurations, inverse_of: :organization, dependent: :destroy
    has_many :oauth_app_organizations, inverse_of: :oauth_app, dependent: :destroy

    validates :quota_in_bytes, :seats, presence: true
    validates(
      :name,
      presence: true,
      uniqueness: true,
      format: { with: /\A[a-z0-9\-]+\z/, message: 'must only contain lowercase letters, numbers & hyphens' }
    )
    validates(
      :geocoding_quota,
      :here_isolines_quota,
      numericality: { only_integer: true }
    )
    validates :default_quota_in_bytes, numericality: { only_integer: true, allow_nil: true, greater_than: 0 }
    validates :auth_saml_configuration, carto_json_symbolizer: true
    validate :validate_password_expiration_in_d
    validate :organization_name_collision
    validate :validate_seats
    validate :authentication_methods_available

    before_validation :ensure_auth_saml_configuration
    before_validation :set_default_quotas
    before_save :register_modified_quotas
    after_save :save_metadata
    before_destroy :destroy_related_resources
    after_destroy :destroy_metadata

    serialize :auth_saml_configuration, CartoJsonSymbolizerSerializer

    ## AR compatibility
    alias values attributes
    ## ./ AR compatibility

    def self.find_by_database_name(database_name)
      Carto::Organization
        .joins('INNER JOIN users ON organizations.owner_id = users.id')
        .where('users.database_name = ?', database_name).first
    end

    def default_password_expiration_in_d
      Cartodb.get_config(:passwords, 'expiration_in_d')
    end

    def valid_builder_seats?(users = [])
      remaining_seats(excluded_users: users).positive?
    end

    def remaining_seats(excluded_users: [])
      seats - assigned_seats(excluded_users: excluded_users)
    end

    def assigned_seats(excluded_users: [])
      builder_users.count { |u| !excluded_users.map(&:id).include?(u.id) }
    end

    # Make code more uniform with user.database_schema
    def database_schema
      name
    end

    def last_billing_cycle
      owner ? owner.last_billing_cycle : Date.today
    end

    def twitter_imports_count(options = {})
      require_organization_owner_presence!
      date_to = (options[:to] ? options[:to].to_date : Date.today)
      date_from = (options[:from] ? options[:from].to_date : owner.last_billing_cycle)
      Carto::SearchTweet.twitter_imports_count(users.joins(:search_tweets), date_from, date_to)
    end
    alias get_twitter_imports_count twitter_imports_count

    def owner?(user)
      owner_id == user.id
    end

    def tags(type, exclude_shared = true)
      users.map { |u| u.tags(exclude_shared, type) }.flatten
    end

    def public_vis_by_type(type, page_num, items_per_page, tags, order = 'updated_at', version = nil)
      CartoDB::Visualization::Collection.new.fetch(
        user_id: users.pluck(:id),
        type: type,
        privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC,
        page: page_num,
        per_page: items_per_page,
        tags: tags,
        order: order,
        o: { updated_at: :desc },
        version: version
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

    def remaining_viewer_seats(excluded_users: [])
      viewer_seats - assigned_viewer_seats(excluded_users: excluded_users)
    end

    def assigned_viewer_seats(excluded_users: [])
      viewer_users.count { |u| !excluded_users.map(&:id).include?(u.id) }
    end

    def notify_if_disk_quota_limit_reached
      ::Resque.enqueue(::Resque::OrganizationJobs::Mail::DiskQuotaLimitReached, id) if disk_quota_limit_reached?
    end

    def notify_if_seat_limit_reached
      ::Resque.enqueue(::Resque::OrganizationJobs::Mail::SeatLimitReached, id) if reached_seats_limit?
    end

    def database_name
      owner&.database_name
    end

    def revoke_cdb_conf_access
      users.map { |user| user.db_service.revoke_cdb_conf_access }
    end

    def create_group(display_name)
      Carto::Group.create_group_with_extension(self, display_name)
    end

    def name_to_display
      display_name || name
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

    def builder_users
      users.reject(&:viewer)
    end

    def viewer_users
      users.select(&:viewer)
    end

    def admin?(user)
      user.belongs_to_organization?(self) && user.organization_admin?
    end

    def non_owner_users
      owner ? users.where.not(id: owner.id) : users
    end

    def inheritable_feature_flags
      inherit_owner_ffs ? owner.self_feature_flags : Carto::FeatureFlag.none
    end

    delegate :dbdirect_effective_ips, to: :owner

    delegate :dbdirect_effective_ips=, to: :owner

    def map_views_count
      users.map(&:map_views_count).sum
    end

    def require_organization_owner_presence!
      raise Carto::Organization::OrganizationWithoutOwner, self unless owner
    end

    # INFO: replacement for destroy because destroying owner triggers
    # organization destroy
    def destroy_cascade(delete_in_central: false)
      groups.each(&:destroy_group_with_extension)
      destroy_non_owner_users
      owner ? owner.sequel_user.destroy_cascade : destroy
    end

    def validate_seats_for_signup(user, errors)
      errors.add(:organization, 'not enough seats') if user.builder? && !valid_builder_seats?([user])

      return unless user.viewer? && remaining_viewer_seats(excluded_users: [user]) <= 0

      errors.add(:organization, 'not enough viewer seats')
    end

    def validate_for_signup(errors, user)
      validate_seats_for_signup(user, errors)

      return if valid_disk_quota?(user.quota_in_bytes.to_i)

      errors.add(:quota_in_bytes, 'not enough disk quota')
    end

    private

    def destroy_non_owner_users
      non_owner_users.each do |user|
        user.ensure_nonviewer
        user.shared_entities.map(&:entity).uniq.each(&:delete)
        user.sequel_user.destroy_cascade
      end
    end

    def destroy_assets
      assets.map { |asset| Carto::Asset.find(asset.id) }.map(&:destroy).all?
    end

    def reached_seats_limit?
      remaining_seats < 1
    end

    def authentication_methods_available
      if whitelisted_email_domains.present? && !auth_enabled?
        errors.add(:whitelisted_email_domains, 'enable at least one auth. system or clear whitelisted email domains')
      end
    end

    def organization_name_collision
      errors.add(:name, 'cannot exist as user') if Carto::User.exists?(username: name)
    end

    def validate_seats
      errors.add(:seats, 'cannot be less than the number of builders') if seats && remaining_seats.negative?

      return unless viewer_seats && remaining_viewer_seats.negative?

      errors.add(:viewer_seats, 'cannot be less than the number of viewers')
    end

    def validate_password_expiration_in_d
      valid = password_expiration_in_d.blank? || password_expiration_in_d.positive? && password_expiration_in_d < 366
      errors.add(:password_expiration_in_d, 'must be greater than 0 and lower than 366') unless valid
    end

    def ensure_auth_saml_configuration
      self.auth_saml_configuration ||= {}
    end

  end
end

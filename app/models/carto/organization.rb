require 'active_record'
require_relative '../../helpers/data_services_metrics_helper'
require_dependency 'carto/helpers/auth_token_generator'
require_dependency 'carto/carto_json_serializer'
require_dependency 'carto/helpers/organization_commons'

module Carto
  class Organization < ActiveRecord::Base

    include DataServicesMetricsHelper
    include AuthTokenGenerator
    include Carto::OrganizationSoftLimits
    include Carto::OrganizationCommons

    serialize :auth_saml_configuration, CartoJsonSymbolizerSerializer
    before_validation :ensure_auth_saml_configuration
    validates :auth_saml_configuration, carto_json_symbolizer: true

    has_many :users, -> { order(:username) }, inverse_of: :organization
    belongs_to :owner, class_name: Carto::User, inverse_of: :owned_organization
    has_many :groups, -> { order(:display_name) }, inverse_of: :organization
    has_many :assets, class_name: Carto::Asset, dependent: :destroy, inverse_of: :organization
    has_many :notifications, -> { order('created_at DESC') }, dependent: :destroy
    has_many :connector_configurations, inverse_of: :organization, dependent: :destroy
    has_many :oauth_app_organizations, inverse_of: :oauth_app, dependent: :destroy

    before_destroy :destroy_groups_with_extension

    def self.find_by_database_name(database_name)
      Carto::Organization.
        joins('INNER JOIN users ON organizations.owner_id = users.id').
        where('users.database_name = ?', database_name).first
    end

    ##
    # SLOW! Checks redis data (geocoding and isolines) for every user in every organization
    # delta: get organizations who are also this percentage below their limit.
    #        example: 0.20 will get all organizations at 80% of their map view limit
    #
    def self.overquota(delta = 0)
      Carto::Organization.find_each.select do |o|
        limit = o.geocoding_quota.to_i - (o.geocoding_quota.to_i * delta)
        over_geocodings = o.get_geocoding_calls > limit
        limit = o.here_isolines_quota.to_i - (o.here_isolines_quota.to_i * delta)
        over_here_isolines = o.get_here_isolines_calls > limit
        limit = o.obs_snapshot_quota.to_i - (o.obs_snapshot_quota.to_i * delta)
        over_obs_snapshot = o.get_obs_snapshot_calls > limit
        limit = o.obs_general_quota.to_i - (o.obs_general_quota.to_i * delta)
        over_obs_general = o.get_obs_general_calls > limit
        limit = o.twitter_datasource_quota.to_i - (o.twitter_datasource_quota.to_i * delta)
        over_twitter_imports = o.twitter_imports_count > limit
        limit = o.mapzen_routing_quota.to_i - (o.mapzen_routing_quota.to_i * delta)
        over_mapzen_routing = o.get_mapzen_routing_calls > limit
        over_geocodings || over_twitter_imports || over_here_isolines || over_obs_snapshot || over_obs_general || over_mapzen_routing
      rescue Carto::Organization::OrganizationWithoutOwner => e
        log_warning(message: 'Skipping inconsistent organization', organization: o, exception: e)
        false
      end
    end

    def get_geocoding_calls(options = {})
      require_organization_owner_presence!
      date_to = (options[:to] ? options[:to].to_date : Date.today)
      date_from = (options[:from] ? options[:from].to_date : owner.last_billing_cycle)
      get_organization_geocoding_data(self, date_from, date_to)
    end

    def period_end_date
      owner&.period_end_date
    end

    def get_here_isolines_calls(options = {})
      require_organization_owner_presence!
      date_to = (options[:to] ? options[:to].to_date : Date.today)
      date_from = (options[:from] ? options[:from].to_date : owner.last_billing_cycle)
      get_organization_here_isolines_data(self, date_from, date_to)
    end

    def get_mapzen_routing_calls(options = {})
      require_organization_owner_presence!
      date_to = (options[:to] ? options[:to].to_date : Date.today)
      date_from = (options[:from] ? options[:from].to_date : owner.last_billing_cycle)
      get_organization_mapzen_routing_data(self, date_from, date_to)
    end

    def get_obs_snapshot_calls(options = {})
      require_organization_owner_presence!
      date_to = (options[:to] ? options[:to].to_date : Date.today)
      date_from = (options[:from] ? options[:from].to_date : owner.last_billing_cycle)
      get_organization_obs_snapshot_data(self, date_from, date_to)
    end

    def get_obs_general_calls(options = {})
      require_organization_owner_presence!
      date_to = (options[:to] ? options[:to].to_date : Date.today)
      date_from = (options[:from] ? options[:from].to_date : owner.last_billing_cycle)
      get_organization_obs_general_data(self, date_from, date_to)
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

    def remaining_geocoding_quota(options = {})
      remaining = geocoding_quota.to_i - get_geocoding_calls(options)
      (remaining > 0 ? remaining : 0)
    end

    def remaining_here_isolines_quota(options = {})
      remaining = here_isolines_quota.to_i - get_here_isolines_calls(options)
      (remaining > 0 ? remaining : 0)
    end

    def remaining_mapzen_routing_quota(options = {})
      remaining = mapzen_routing_quota.to_i - get_mapzen_routing_calls(options)
      (remaining > 0 ? remaining : 0)
    end

    def remaining_obs_snapshot_quota(options = {})
      remaining = obs_snapshot_quota.to_i - get_obs_snapshot_calls(options)
      (remaining > 0 ? remaining : 0)
    end

    def remaining_obs_general_quota(options = {})
      remaining = obs_general_quota.to_i - get_obs_general_calls(options)
      (remaining > 0 ? remaining : 0)
    end

    def signup_page_enabled
      whitelisted_email_domains.present? && auth_enabled?
    end

    def auth_enabled?
      auth_username_password_enabled || auth_google_enabled || auth_github_enabled || auth_saml_enabled?
    end

    def database_name
      owner ? owner.database_name : nil
    end

    def create_group(display_name)
      Carto::Group.create_group_with_extension(self, display_name)
    end

    def name_to_display
      display_name.nil? ? name : display_name
    end

    def assigned_quota
      users.sum(:quota_in_bytes).to_i
    end

    def unassigned_quota
      quota_in_bytes - assigned_quota
    end

    def require_organization_owner_presence!
      raise Carto::Organization::OrganizationWithoutOwner.new(self) if owner.nil?
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
      users.reject { |u| owner && u.id == owner.id }
    end

    def inheritable_feature_flags
      inherit_owner_ffs ? owner.self_feature_flags : Carto::FeatureFlag.none
    end

    def dbdirect_effective_ips
      owner.dbdirect_effective_ips
    end

    def dbdirect_effective_ips=(ips)
      owner.dbdirect_effective_ips = ips
    end

    def remaining_twitter_quota
      remaining = twitter_datasource_quota - twitter_imports_count
      (remaining > 0 ? remaining : 0)
    end

    def get_api_calls(options = {})
      users.map { |u| u.get_api_calls(options).sum }.sum
    end

    private

    def ensure_auth_saml_configuration
      self.auth_saml_configuration ||= {}
    end

    def destroy_groups_with_extension
      return unless groups

      groups.map { |g| g.destroy_group_with_extension }

      reload
    end

  end
end

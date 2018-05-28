require 'active_record'
require_relative '../../helpers/data_services_metrics_helper'
require_dependency 'carto/helpers/auth_token_generator'
require_dependency 'carto/carto_json_serializer'
require_dependency 'common/organization_common'
require_dependency 'carto/db/insertable_array'

module Carto
  class Organization < ActiveRecord::Base
    include DataServicesMetricsHelper
    include AuthTokenGenerator
    include Carto::OrganizationSoftLimits

    serialize :auth_saml_configuration, CartoJsonSymbolizerSerializer
    before_validation :ensure_auth_saml_configuration
    validates :auth_saml_configuration, carto_json_symbolizer: true

    has_many :users, inverse_of: :organization, order: :username
    belongs_to :owner, class_name: Carto::User, inverse_of: :owned_organization
    has_many :groups, inverse_of: :organization, order: :display_name
    has_many :assets, inverse_of: :organization, class_name: Carto::Asset, dependent: :destroy
    has_many :notifications, dependent: :destroy, order: 'created_at DESC'
    has_many :connector_configurations, inverse_of: :organization, dependent: :destroy

    before_destroy :destroy_groups_with_extension

    # INFO: workaround for array saves not working. There is a bug in `activerecord-postgresql-array 0.0.9`
    #  We can remove this when the upgrade to Rails 4 allows us to remove that gem
    before_create :fix_domain_whitelist_for_insert

    def self.find_by_database_name(database_name)
      Carto::Organization.
        joins('INNER JOIN users ON organizations.owner_id = users.id').
        where('users.database_name = ?', database_name).first
    end

    def get_geocoding_calls(options = {})
      require_organization_owner_presence!
      date_to = (options[:to] ? options[:to].to_date : Date.today)
      date_from = (options[:from] ? options[:from].to_date : owner.last_billing_cycle)
      get_organization_geocoding_data(self, date_from, date_to)
    end

    def period_end_date
      owner && owner.period_end_date
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
      self.users.sum(:quota_in_bytes).to_i
    end

    def unassigned_quota
      self.quota_in_bytes - assigned_quota
    end

    def require_organization_owner_presence!
      if owner.nil?
        raise ::Organization::OrganizationWithoutOwner.new(self)
      end
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

    private

    def ensure_auth_saml_configuration
      self.auth_saml_configuration ||= Hash.new
    end

    def destroy_groups_with_extension
      return unless groups

      groups.map { |g| g.destroy_group_with_extension }

      reload
    end

    def fix_domain_whitelist_for_insert
      self.whitelisted_email_domains = Carto::InsertableArray.new(whitelisted_email_domains)
    end
  end
end

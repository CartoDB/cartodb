require 'active_record'
require_relative '../../helpers/data_services_metrics_helper'

module Carto
  class Organization < ActiveRecord::Base
    include DataServicesMetricsHelper

    has_many :users, inverse_of: :organization, order: :username
    belongs_to :owner, class_name: Carto::User, inverse_of: :owned_organization
    has_many :groups, inverse_of: :organization, order: :display_name

    before_destroy :destroy_groups_with_extension

    def self.find_by_database_name(database_name)
      Carto::Organization.
        joins('INNER JOIN users ON organizations.owner_id = users.id').
        where('users.database_name = ?', database_name).first
    end

    def get_geocoding_calls(options = {})
      date_to = (options[:to] ? options[:to].to_date : Date.today)
      date_from = (options[:from] ? options[:from].to_date : owner.last_billing_cycle)
      if owner.has_feature_flag?('new_geocoder_quota')
        get_organization_geocoding_data(self, date_from, date_to)
      else
        users.
          joins(:geocodings).
          where('geocodings.kind' => 'high-resolution').
          where('geocodings.created_at >= ? and geocodings.created_at <= ?', date_from, date_to + 1.days).
          sum("processed_rows + cache_hits".lit).to_i
      end
    end

    def period_end_date
      owner.period_end_date
    end

    def get_new_system_geocoding_calls(options = {})
      date_to = (options[:to] ? options[:to].to_date : Date.current)
      date_from = (options[:from] ? options[:from].to_date : owner.last_billing_cycle)
      get_organization_geocoding_data(self, date_from, date_to)
    end

    def get_here_isolines_calls(options = {})
      date_to = (options[:to] ? options[:to].to_date : Date.today)
      date_from = (options[:from] ? options[:from].to_date : owner.last_billing_cycle)
      get_organization_here_isolines_data(self, date_from, date_to)
    end

    def get_obs_snapshot_calls(options = {})
      date_to = (options[:to] ? options[:to].to_date : Date.today)
      date_from = (options[:from] ? options[:from].to_date : owner.last_billing_cycle)
      get_organization_obs_snapshot_data(self, date_from, date_to)
    end

    def get_obs_general_calls(options = {})
      date_to = (options[:to] ? options[:to].to_date : Date.today)
      date_from = (options[:from] ? options[:from].to_date : owner.last_billing_cycle)
      get_organization_obs_general_data(self, date_from, date_to)
    end

    def twitter_imports_count(options = {})
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

    def remaining_obs_snapshot_quota(options = {})
      remaining = obs_snapshot_quota.to_i - get_obs_snapshot_calls(options)
      (remaining > 0 ? remaining : 0)
    end

    def remaining_obs_general_quota(options = {})
      remaining = obs_general_quota.to_i - get_obs_general_calls(options)
      (remaining > 0 ? remaining : 0)
    end

    def signup_page_enabled
      !whitelisted_email_domains.nil? && !whitelisted_email_domains.empty?
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

    private

    def destroy_groups_with_extension
      return unless groups

      groups.map { |g| g.destroy_group_with_extension }

      reload
    end

  end

end

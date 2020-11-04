module Carto
  module OrganizationQuotas

    extend ActiveSupport::Concern

    DEFAULT_GEOCODING_QUOTA = 0
    DEFAULT_HERE_ISOLINES_QUOTA = 0
    DEFAULT_OBS_SNAPSHOT_QUOTA = 0
    DEFAULT_OBS_GENERAL_QUOTA = 0
    DEFAULT_MAPZEN_ROUTING_QUOTA = nil

    class_methods do
      ##
      # SLOW! Checks redis data (geocoding and isolines) for every user in every organization
      # delta: get organizations who are also this percentage below their limit.
      #        example: 0.20 will get all organizations at 80% of their map view limit
      #
      def overquota(delta = 0)
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

          (over_geocodings ||
           over_twitter_imports ||
           over_here_isolines ||
           over_obs_snapshot ||
           over_obs_general ||
           over_mapzen_routing)
        rescue Carto::Organization::OrganizationWithoutOwner => e
          log_warning(message: 'Skipping inconsistent organization', organization: o, exception: e)
          false
        end
      end
    end

    def valid_disk_quota?(quota = default_quota_in_bytes)
      unassigned_quota >= quota
    end

    def get_geocoding_calls(options = {})
      require_organization_owner_presence!
      date_from, date_to = quota_dates(options)
      get_organization_geocoding_data(self, date_from, date_to)
    end

    def get_here_isolines_calls(options = {})
      require_organization_owner_presence!
      date_from, date_to = quota_dates(options)
      get_organization_here_isolines_data(self, date_from, date_to)
    end

    def get_mapzen_routing_calls(options = {})
      require_organization_owner_presence!
      date_from, date_to = quota_dates(options)
      get_organization_mapzen_routing_data(self, date_from, date_to)
    end

    def get_obs_snapshot_calls(options = {})
      require_organization_owner_presence!
      date_from, date_to = quota_dates(options)
      get_organization_obs_snapshot_data(self, date_from, date_to)
    end

    def get_obs_general_calls(options = {})
      require_organization_owner_presence!
      date_from, date_to = quota_dates(options)
      get_organization_obs_general_data(self, date_from, date_to)
    end

    def remaining_geocoding_quota(options = {})
      remaining = geocoding_quota.to_i - get_geocoding_calls(options)
      (remaining.positive? ? remaining : 0)
    end

    def remaining_here_isolines_quota(options = {})
      remaining = here_isolines_quota.to_i - get_here_isolines_calls(options)
      (remaining.positive? ? remaining : 0)
    end

    def remaining_mapzen_routing_quota(options = {})
      remaining = mapzen_routing_quota.to_i - get_mapzen_routing_calls(options)
      (remaining.positive? ? remaining : 0)
    end

    def remaining_obs_snapshot_quota(options = {})
      remaining = obs_snapshot_quota.to_i - get_obs_snapshot_calls(options)
      (remaining.positive? ? remaining : 0)
    end

    def remaining_obs_general_quota(options = {})
      remaining = obs_general_quota.to_i - get_obs_general_calls(options)
      (remaining.positive? ? remaining : 0)
    end

    def assigned_quota
      users.sum(:quota_in_bytes).to_i
    end

    def unassigned_quota
      quota_in_bytes - assigned_quota
    end

    def remaining_twitter_quota
      remaining = twitter_datasource_quota - twitter_imports_count
      (remaining.positive? ? remaining : 0)
    end

    private

    def quota_dates(options)
      date_to = (options[:to] ? options[:to].to_date : Date.today)
      date_from = (options[:from] ? options[:from].to_date : last_billing_cycle)

      [date_from, date_to]
    end

    def set_default_quotas
      self.geocoding_quota ||= DEFAULT_GEOCODING_QUOTA
      self.here_isolines_quota ||= DEFAULT_HERE_ISOLINES_QUOTA
      self.obs_snapshot_quota ||= DEFAULT_OBS_SNAPSHOT_QUOTA
      self.obs_general_quota ||= DEFAULT_OBS_GENERAL_QUOTA
      self.mapzen_routing_quota ||= DEFAULT_MAPZEN_ROUTING_QUOTA
    end

    # TODO: These variables are not read explicitly. Can they be removed?
    def register_modified_quotas
      @geocoding_quota_modified = geocoding_quota_changed?
      @here_isolines_quota_modified = here_isolines_quota_changed?
      @obs_snapshot_quota_modified = obs_snapshot_quota_changed?
      @obs_general_quota_modified = obs_general_quota_changed?
      @mapzen_routing_quota_modified = mapzen_routing_quota_changed?

      raise errors.join('; ') unless valid?
    end

    def disk_quota_limit_reached?
      unassigned_quota < default_quota_in_bytes
    end

  end
end

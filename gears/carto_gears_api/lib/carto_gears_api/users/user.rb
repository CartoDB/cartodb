require 'values'
require 'active_record'

module CartoGearsApi
  module Users
    # User information.
    #
    # @attr_reader [String] id User id
    # @attr_reader [String] username User name
    # @attr_reader [String] email Email
    # @attr_reader [Integer] quota_in_bytes Disk quota in bytes
    # @attr_reader [Boolean] viewer The user is a viewer (cannot create maps, datasets, etc.)
    # @attr_reader [Boolean] soft_geocoding_limit User can exceed geocoding limit (billable)
    # @attr_reader [Boolean] soft_twitter_datasource_limit User can exceed twitter limit (billable)
    # @attr_reader [Boolean] soft_here_isolines_limit User can exceed HERE geocoder limit (billable)
    # @attr_reader [Boolean] soft_obs_snapshot_limit User can exceed Data Observatory limit (billable)
    # @attr_reader [Boolean] soft_obs_general_limit User can exceed Data Observatory limit (billable)
    # @attr_reader [CartoGearsApi::Organizations::Organization] organization Organization
    class User < Value.new(:id, :username, :email, :organization, :feature_flags, :can_change_email, :quota_in_bytes,
                           :viewer, :soft_geocoding_limit, :soft_twitter_datasource_limit, :soft_here_isolines_limit,
                           :soft_obs_snapshot_limit, :soft_obs_general_limit)
      extend ActiveModel::Naming
      include ActiveRecord::AttributeMethods::PrimaryKey

      def id
        # This is needed to make ActiveRecord::AttributeMethods::PrimaryKey work. Otherwise it
        # won't find the id accessible thanks to Value. Magic is not always compatible.
        @id
      end

      # @return [String] The subdomain required by this user in the current CARTO configuration.
      #                  It takes into account subdomainless URLs and organizations.
      def subdomain
        if CartoDB.subdomainless_urls?
          username
        else
          organization.nil? ? username : organization.name
        end
      end

      def has_feature_flag?(feature_flag)
        @feature_flags.include?(feature_flag)
      end

      def can_change_email?
        @can_change_email
      end
    end
  end
end

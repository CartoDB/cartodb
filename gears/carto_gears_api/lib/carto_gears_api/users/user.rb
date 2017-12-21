require 'values'

module CartoGearsApi
  module Users
    # User information.
    #
    # @attr_reader [String] id User id
    # @attr_reader [String] username User name
    # @attr_reader [String] email Email
    # @attr_reader [Integer] quota_in_bytes Disk quota in bytes
    # @attr_reader [Boolean] viewer The user is a viewer (cannot create maps, datasets, etc.)
    # @attr_reader [CartoGearsApi::Organizations::Organization] organization Organization
    class User < Value.new(:id, :username, :email, :organization, :feature_flags, :can_change_email, :quota_in_bytes,
                           :viewer)
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

      # @api private
      def self.from_model(user)
        CartoGearsApi::Users::User.with(
          id: user.id,
          username: user.username,
          email: user.email,
          organization: user.organization && CartoGearsApi::Organizations::Organization.from_model(user.organization),
          feature_flags: user.feature_flags,
          can_change_email: user.can_change_email?,
          quota_in_bytes: user.quota_in_bytes,
          viewer: user.viewer
        )
      end
    end
  end
end

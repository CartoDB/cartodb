require_dependency 'carto_gears_api/users/user'
require_dependency 'carto_gears_api/organizations/organization'
require_dependency 'carto_gears_api/errors'

module CartoGearsApi
  module Users
    class UsersService
      # Returns the logged user at the request.
      #
      # @param request [ActionDispatch::Request] CARTO request, as received in any controller.
      # @return [User] the user.
      def logged_user(request)
        user(request.env['warden'].user(CartoDB.extract_subdomain(request)))
      end

      # Updates the values of a user.
      #
      # Only the following values can be updated: +quota_in_bytes+, +viewer+, +soft_*_limit+
      # @note Setting +viewer = true+ resets all quotas to 0
      #
      # @param user [User] the user with updated values
      # @return [User] the modified user
      # @raise [Errors::RecordNotFound] if the user could not be found in the database
      # @raise [Errors::ValidationFailed] if the validation failed
      #
      # @example Change the quota of the logged user
      #   user_service = CartoGearsApi::Users::UsersService.new
      #   user_service.update(user_service.logged_user(request).with(quota_in_bytes: 10000000))
      def update(updated_user)
        db_user = ::User.find(id: updated_user.id)
        raise CartoGearsApi::Errors::RecordNotFound.new(updated_user) unless db_user

        db_user.viewer = updated_user.viewer
        db_user.quota_in_bytes = updated_user.quota_in_bytes
        db_user.soft_geocoding_limit = updated_user.soft_geocoding_limit
        db_user.soft_twitter_datasource_limit = updated_user.soft_twitter_datasource_limit
        db_user.soft_here_isolines_limit = updated_user.soft_here_isolines_limit
        db_user.soft_obs_snapshot_limit = updated_user.soft_obs_snapshot_limit
        db_user.soft_obs_general_limit = updated_user.soft_obs_general_limit

        raise CartoGearsApi::Errors::ValidationFailed.new(db_user.errors) unless db_user.save
        user(db_user)
      end

      private

      def user(user)
        CartoGearsApi::Users::User.with(
          id: user.id,
          username: user.username,
          email: user.email,
          organization: user.organization ? organization(user.organization) : nil,
          feature_flags: user.feature_flags,
          can_change_email: user.can_change_email?,
          quota_in_bytes: user.quota_in_bytes,
          viewer: user.viewer,
          soft_geocoding_limit: user.soft_geocoding_limit,
          soft_twitter_datasource_limit: user.soft_twitter_datasource_limit,
          soft_here_isolines_limit: user.soft_here_isolines_limit,
          soft_obs_snapshot_limit: user.soft_obs_snapshot_limit,
          soft_obs_general_limit: user.soft_obs_general_limit
        )
      end

      def organization(organization)
        CartoGearsApi::Organizations::Organization.with(name: organization.name)
      end
    end
  end
end

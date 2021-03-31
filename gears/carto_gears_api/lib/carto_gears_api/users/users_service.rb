module CartoGearsApi
  module Users
    class UsersService
      # Returns the logged user at the request.
      #
      # @param request [ActionDispatch::Request] CARTO request, as received in any controller.
      # @return [User] the user.
      def logged_user(request)
        CartoGearsApi::Users::User.from_model(request.env['warden'].user(CartoDB.extract_subdomain(request)))
      end

      # Converts an user to a viewer, without editing rights.
      # It also sets all quotas to 0
      #
      # @param user_id [UUID] the user id
      # @return [User] the updated user
      #
      # @raise [Errors::RecordNotFound] if the user could not be found in the database
      # @raise [Errors::ValidationFailed] if the validation failed
      def make_viewer(user_id)
        user = find_user(user_id)

        user.viewer = true
        raise CartoGearsApi::Errors::ValidationFailed.new(user.errors) unless user.save
        user.update_in_central

        CartoGearsApi::Users::User.from_model(user)
      end

      # Converts an user to a builder, with full editing rights.
      #
      # @param user_id [UUID] the user id
      # @param quota_in_bytes [Integer] quota for the user. It defaults to the organization default quota
      # @return [User] the updated user
      #
      # @raise [Errors::RecordNotFound] if the user could not be found in the database
      # @raise [Errors::ValidationFailed] if the validation failed
      def make_builder(user_id, quota_in_bytes: nil)
        user = find_user(user_id)

        user.viewer = false
        user.quota_in_bytes = quota_in_bytes || user.organization.default_quota_in_bytes
        user.soft_geocoding_limit = user.organization.owner.soft_geocoding_limit
        user.soft_here_isolines_limit = user.organization.owner.soft_here_isolines_limit
        user.soft_twitter_datasource_limit = user.organization.owner.soft_twitter_datasource_limit
        user.soft_mapzen_routing_limit = user.organization.owner.soft_mapzen_routing_limit

        raise CartoGearsApi::Errors::ValidationFailed.new(user.errors) unless user.save
        user.update_in_central

        CartoGearsApi::Users::User.from_model(user)
      end

      # Checks the password of a user
      #
      # @param user_id [UUID] the user id
      # @param password [String] password to check
      # @return [Boolean] true if the password matches with the user, false otherwise
      #
      # @raise [Errors::RecordNotFound] if the user could not be found in the database
      # @raise [Errors::ValidationFailed] if the user has no password set (Google/GitHub sign in)
      def valid_password?(user_id, password)
        user = find_user(user_id)

        unless user.password_set?
          user.errors.add(:password, "User has no password set")
          raise CartoGearsApi::Errors::ValidationFailed.new(user.errors)
        end

        user.validate_old_password(password)
      end

      # Changes the password of a user
      #
      # @param user_id [UUID] the user id
      # @param password [String] password to set
      # @return [User] the updated user
      #
      # @raise [Errors::RecordNotFound] if the user could not be found in the database
      # @raise [Errors::ValidationFailed] if the password validation failed
      # @raise [Errors::SavingError] if the password could not be saved because of an internal error
      def change_password(user_id, new_password)
        user = find_user(user_id)

        user.password = new_password
        user.password_confirmation = new_password

        raise CartoGearsApi::Errors::ValidationFailed.new(user.errors) unless user.errors.empty?

        user.update_in_central
        user.save(raise_on_failure: true)
      rescue CartoDB::CentralCommunicationFailure, Sequel::ValidationFailed
        raise CartoGearsApi::Errors::SavingError.new
      end

      private

      def find_user(user_id)
        user = ::User.find(id: user_id)
        raise CartoGearsApi::Errors::RecordNotFound.new('User', user_id) unless user
        user
      end
    end
  end
end

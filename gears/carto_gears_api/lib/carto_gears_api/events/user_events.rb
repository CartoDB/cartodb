require_dependency 'carto_gears_api/events/base_event'
require_dependency 'carto_gears_api/users/user'

module CartoGearsApi
  module Events
    # Event triggered when a user is created
    # @attr_reader [Users::User] user user which was created
    class UserCreationEvent < BaseEvent
      attr_reader :user

      # @api private
      def initialize(user)
        @user = Users::User.from_model(user)
      end
    end
  end
end

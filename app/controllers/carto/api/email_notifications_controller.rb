module Carto
  module Api
    class EmailNotificationsController < ::Api::ApplicationController

      ssl_required :update
      before_action :load_notifications

      rescue_from StandardError, with: :rescue_from_standard_error

      def show
        render_jsonp({ notifications: decorate_notifications }, 200)
      end

      def update
        notifications = params.require(:notifications)
        @carto_user.email_notifications = notifications

        render_jsonp({}, 204)
      end

      private

      def load_notifications
        @carto_user = Carto::User.find(current_user.id)
        @notifications = @carto_user.email_notifications
      end

      def decorate_notifications
        payload = {}
        Carto::UserEmailNotification::VALID_NOTIFICATIONS.map { |n| payload[n] = true }

        @notifications.each do |notification|
          payload[notification.notification] = notification.enabled
        end
        payload
      end

    end
  end
end

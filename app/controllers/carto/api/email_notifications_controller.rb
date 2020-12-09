module Carto
  module Api
    class EmailNotificationsController < ::Api::ApplicationController

      ssl_required :update
      before_action :load_notifications

      rescue_from StandardError, with: :rescue_from_standard_error

      def show
        render_jsonp({ notifications: @carto_user.decorate_email_notifications }, 200)
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

    end
  end
end

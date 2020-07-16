require_dependency 'carto/uuidhelper'

module Carto
  module Api
    class StaticNotificationsController < ::Api::ApplicationController
      ssl_required :update
      before_filter :load_static_notifications, only: [:update]

      rescue_from StandardError, with: :rescue_from_standard_error
      rescue_from Carto::LoadError, with: :rescue_from_carto_error

      def update
        category = params[:category].to_sym
        @notifications.notifications[category] = params[:notifications]
        if @notifications.save
          render_jsonp({ notifications: @notifications.notifications[category] }, 200)
        else
          render_jsonp({ errors: @notifications.errors.to_h }, 422)
        end
      end

      private

      def load_static_notifications
        @notifications = Carto::User.find(current_user.id).static_notifications
      end
    end
  end
end

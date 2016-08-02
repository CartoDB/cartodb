# encoding: utf-8
require_dependency 'carto/uuidhelper'

module Carto
  module Api
    class UserNotificationsController < ::Api::ApplicationController
      include Carto::ControllerHelper

      ssl_required :update
      before_filter :load_user_notifications, only: [:update]

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

      def load_user_notifications
        @notifications = Carto::User.find(current_user.id).notifications
      end
    end
  end
end

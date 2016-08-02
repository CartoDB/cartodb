# encoding: utf-8
require_dependency 'carto/uuidhelper'

module Carto
  module Api
    class UserNotificationsController < ::Api::ApplicationController
      include Carto::ControllerHelper

      ssl_required :update
      before_filter :load_notifications, only: [:update]

      rescue_from StandardError, with: :rescue_from_standard_error
      rescue_from Carto::LoadError, with: :rescue_from_carto_error
      rescue_from Carto::UnauthorizedError, with: :rescue_from_carto_error
      rescue_from Carto::UnprocesableEntityError, with: :rescue_from_carto_error

      def update
        @category_notifications.replace(params[:notifications])
        @user.notifications.save!
        render_jsonp({ notifications: @category_notifications }, 200)
      end

      private

      def load_notifications
        @user = Carto::User.find(current_user.id)
        @category_notifications = @user.notifications.notifications_for(:builder)
      end
    end
  end
end

# encoding: utf-8

module Carto
  module Api
    class ReceivedNotificationsController < ::Api::ApplicationController
      include Carto::ControllerHelper
      extend Carto::DefaultRescueFroms

      ssl_required :update

      before_filter :load_user
      before_filter :load_notification, only: [:update]

      setup_default_rescues

      def update
        changed_notification = params[:notification]
        if changed_notification
          @received_notification.read_at = DateTime.now if changed_notification[:read_at]
          @received_notification.save!
        end

        render_jsonp ReceivedNotificationPresenter.new(@received_notification)
      end

      private

      def load_user
        @user = Carto::User.find(current_user.id)
        raise Carto::UnauthorizedError.new('Can only access own notifications') unless @user.id == params[:user_id]
      end

      def load_notification
        @received_notification = @user.received_notifications.find(params[:id])
      end
    end
  end
end

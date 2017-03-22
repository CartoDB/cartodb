# encoding: utf-8

module Carto
  module Api
    class ReceivedNotificationsController < ::Api::ApplicationController
      include Carto::ControllerHelper
      extend Carto::DefaultRescueFroms

      ssl_required :update

      before_filter :only_owner
      before_filter :load_notification, only: [:update]

      setup_default_rescues

      def update
        changed_notification = params[:notification]
        if changed_notification
          read_at = changed_notification[:read_at]
          @received_notification.read_at = DateTime.parse(read_at) if read_at
          @received_notification.save!
        end

        render_jsonp ReceivedNotificationPresenter.new(@received_notification).to_hash

      rescue ArgumentError => e
        render_jsonp({ errors: { read_at: 'invalid date format' } }, 422)
        CartoDB::Logger.warning(exception: e)
      end

      private

      def only_owner
        unless current_user.id == params[:user_id]
          raise Carto::UnauthorizedError.new('Can only access own notifications')
        end
      end

      def load_notification
        @received_notification = ReceivedNotification.where(user_id: current_user.id, id: params[:id]).first!
      end
    end
  end
end

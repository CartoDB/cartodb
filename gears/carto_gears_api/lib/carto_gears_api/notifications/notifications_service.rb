module CartoGearsApi
  module Notifications
    class NotificationsService
      # Creates a new notification. Does not send it to any user.
      # @see send_notification
      #
      # @param [String] body markdown body of the notification
      # @param [String] icon name of the icon (defaults to a generic notification icon)
      # @return [Notification] the created notification
      # @raise [Errors::ValidationFailed] if there were some invalid parameters
      def create_notification(body:, icon: Notification::ICON_ALERT)
        CartoGearsApi::Notifications::Notification.from_model(Carto::Notification.create!(body: body, icon: icon))
      rescue ActiveRecord::RecordInvalid => e
        raise Errors::ValidationFailed.new(e.record.errors.messages)
      end

      # Send a notification to a user
      #
      # @param [String] notification_id
      # @param [String] user_id
      # @raise [Errors::RecordNotFound] if the user or notification does not exist in the database
      def send_notification(notification_id, user_id)
        notification = Carto::Notification.where(id: notification_id).first
        raise Errors::RecordNotFound.new('Notification', notification_id) unless notification
        user = Carto::User.where(id: user_id).first
        raise Errors::RecordNotFound.new('User', user_id) unless user

        user.received_notifications.create!(notification: notification, received_at: DateTime.now)
        nil
      end
    end
  end
end

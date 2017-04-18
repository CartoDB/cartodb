require 'values'

module CartoGearsApi
  module Notifications
    # Notification information.
    #
    # @attr_reader [String] id notification id
    # @attr_reader [String] icon name of the icon shown next to the notification
    # @attr_reader [String] body text of the notification, markdown formatted
    # @attr_reader [Organization] organization organization if this is an org-notification, +nil+ otherwise
    # @attr_reader [String] recipients +builders+, +viewers+ or +all+ if this is an org-notification, nil otherwise
    # @attr_reader [DateTime] created_at date this notification was created at
    class Notification < Value.new(:id, :icon, :body, :organization, :recipients, :created_at)
      ICON_ALERT = Carto::Notification::ICON_ALERT
      ICON_SUCCESS = Carto::Notification::ICON_SUCCESS

      # @api private
      def self.from_model(notification)
        CartoGearsApi::Notifications::Notification.with(
          id: notification.id,
          body: notification.body,
          icon: notification.icon,
          organization: notification.organization && Organizations::Organization.from_model(notification.organization),
          recipients: notification.recipients,
          created_at: notification.created_at
        )
      end
    end
  end
end

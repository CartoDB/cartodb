require 'values'

module CartoGearsApi
  module Notifications
    # Notification information.
    #
    # @attr_reader [String] id notification id
    # @attr_reader [String] icon name of the icon shown next to the notification
    # @attr_reader [String] body text of the notification, markdown formatted
    # @attr_reader [Organization] organization organization if this is an org-notification, +nil+ otherwise
    # @attr_reader [String] recipients +builders+, +viewers+, +all+ if this is an org-notification, nil otherwise
    # @attr_reader [DateTime] created_at date this notification was created at
    class Notification < Value.new(:id, :icon, :body, :organization, :recipients, :created_at)
    end
  end
end

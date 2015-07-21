# encoding: UTF-8

require 'active_record'

module Carto
  class UserNotifications < ActiveRecord::Base

      LIKE_NOTIFICACION = 1
      SHARE_NOTIFICATION = 2
      NOTIFICATIONS_TYPE = [LIKE_NOTIFICACION, SHARE_NOTIFICATION]

      validates :notification_id, inclusion: { in: NOTIFICATIONS_TYPE,
                                                   message: "%{value} is not a valid notification type" }

      belongs_to :user

      def self.notifications_type
        return NOTIFICATIONS_TYPE
      end

  end
end

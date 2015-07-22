# encoding: UTF-8

require 'active_record'

module Carto
  class UserNotification < ActiveRecord::Base

      validates :notification_id, inclusion: { in: Carto::Notification.types,
                                                   message: "%{value} is not a valid notification type" }
      belongs_to :user

      # Used to unsubscribe using the link provided in the email
      def self.generate_unsubscribe_hash(user, notification_type)
        digest = OpenSSL::Digest.new('sha1')
        data = self.generate_hash_string(user,notification_type)
        return OpenSSL::HMAC.hexdigest(digest, user.salt, data)
      end

      def unsubscribe(hash)
        if Carto::UserNotification.generate_unsubscribe_hash(self.user, self.notification_id) == hash
          UserNotification.connection.update_sql("UPDATE user_notifications
                                                  SET enabled=false
                                                  WHERE user_id = '#{self.user.id}'
                                                  AND notification_id = #{self.notification_id}")
        end
      end

      private

      def self.generate_hash_string(user, notification_id)
        return user.username + ":" + user.email + ":" + notification_id.to_s
      end
  end
end

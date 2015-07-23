# encoding: UTF-8

require 'active_record'

module Carto
  class UserNotification < ActiveRecord::Base

      belongs_to :user

      # Used to unsubscribe using the link provided in the email
      def self.generate_unsubscribe_hash(user, notification_type)
        digest = OpenSSL::Digest.new('sha1')
        data = self.generate_hash_string(user,notification_type)
        return OpenSSL::HMAC.hexdigest(digest, user.salt, data)
      end

      def self.verify_hash(hash)
        Carto::Notification.types.each do |type|
          if Carto::UserNotification.generate_unsubscribe_hash(self.user, type) == hash
            return type
            break
          end
        end

        return nil
      end

      def unsubscribe(type)
        UserNotification.connection.update_sql("UPDATE user_notifications
                                                SET #{type}=false
                                                WHERE user_id = '#{self.user.id}'")
      end

      private

      def self.generate_hash_string(user, notification_type)
        return user.username + ":" + user.email + ":" + notification_type.to_s
      end
  end
end

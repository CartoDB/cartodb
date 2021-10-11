module Carto
  class UserEmailNotification < ActiveRecord::Base

    belongs_to :user, class_name: 'Carto::User', inverse_of: :email_notifications

    validates :user, presence: true
    validate  :valid_notification

    NOTIFICATION_DO_SUBSCRIPTIONS = 'do_subscriptions'.freeze
    NOTIFICATION_IMPORTS = 'imports'.freeze
    VALID_NOTIFICATIONS = [NOTIFICATION_DO_SUBSCRIPTIONS, NOTIFICATION_IMPORTS].freeze

    def self.new_do_subscriptions(user_id)
      Carto::UserEmailNotification.create!(
        user_id: user_id,
        notification: NOTIFICATION_DO_SUBSCRIPTIONS,
        enabled: true
      )
    end

    private

    def valid_notification
      errors.add(:notification, 'Invalid notification') unless VALID_NOTIFICATIONS.include?(notification)
    end

  end
end

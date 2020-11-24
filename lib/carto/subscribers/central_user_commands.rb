require './lib/carto/user_creator'
require './lib/carto/user_updater'

module Carto
  module Subscribers
    class CentralUserCommands

      include ::LoggerHelper

      attr_reader :notifications_topic

      def initialize(notifications_topic)
        @notifications_topic = notifications_topic
      end

      def update_user(user_param)
        log_debug(message: 'Processing :update_user')
        user_id = user_param.delete('remote_user_id')

        return unless user_id.present? && user_param.any?

        user = ::User.where(id: user_id).first
        Carto::UserUpdater.new(user).update(user_param)

        log_info(message: 'User updated', current_user: user)
      end

      def create_user(user_param)
        log_debug(message: 'Processing :create_user')
        user = Carto::UserCreator.new.create(user_param)
        notifications_topic.publish(:user_created, {
                                      username: user.username,
                                      id: user.id
                                    })
        log_info(message: 'User created', current_user: user)
      end

      def delete_user(user_param)
        log_debug(message: 'Processing :delete_user')
        user = ::User.where(id: user_param[:id]).first
        user.set_force_destroy if user_param[:force] == 'true'
        user.destroy
        notifications_topic.publish(:user_deleted, {
                                      username: user.username
                                    })
        log_info(message: 'User deleted', current_user: user.username)
      rescue CartoDB::SharedEntitiesError
        notifications_topic.publish(:user_could_not_be_deleted, {
                                      username: user.username,
                                      reason: 'user has shared entities'
                                    })
        log_info(message: 'User could not be deleted because it has shared entities',
                 current_user: user.username)
      end

      private

      def log_context
        super.merge(class_name: self.class.name)
      end

    end
  end
end

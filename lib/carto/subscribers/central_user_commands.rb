require './lib/carto/user_creator'
require './lib/carto/user_updater'

module Carto
  module Subscribers
    class CentralUserCommands

      attr_reader :notifications_topic,
                  :logger

      def initialize(notifications_topic:, logger:)
        @notifications_topic = notifications_topic
        @logger = logger
      end

      def update_user(user_param)
        logger.debug(message: 'Processing :update_user', class_name: self.class.name)
        user_id = user_param.delete('remote_user_id')

        return unless user_id.present? && user_param.any?

        user = ::User.where(id: user_id).first
        Carto::UserUpdater.new(user).update(user_param)

        logger.info(message: 'User updated', current_user: user, class_name: self.class.name)
      end

      def create_user(user_param)
        logger.debug(message: 'Processing :create_user', class_name: self.class.name)
        user = Carto::UserCreator.new.create(user_param)
        notifications_topic.publish(:user_created, {
                                      username: user.username,
                                      id: user.id
                                    })
        logger.info(message: 'User created', current_user: user, class_name: self.class.name)
      end

      def delete_user(user_param)
        logger.debug(message: 'Processing :delete_user', class_name: self.class.name)
        user = ::User.where(id: user_param[:id]).first
        user.set_force_destroy if user_param[:force] == 'true'
        user.destroy
        notifications_topic.publish(:user_deleted, {
                                      username: user.username
                                    })
        logger.info(message: 'User deleted', current_user: user.username, class_name: self.class.name)
      rescue CartoDB::SharedEntitiesError
        notifications_topic.publish(:user_could_not_be_deleted, {
                                      username: user.username,
                                      reason: 'user has shared entities'
                                    })
        logger.info(message: 'User could not be deleted because it has shared entities', class_name: self.class.name,
                    current_user: user.username)
      end

    end
  end
end

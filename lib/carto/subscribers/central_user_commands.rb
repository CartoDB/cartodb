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

      def update_user(payload)
        Carto::Common::CurrentRequest.with_request_id(payload[:request_id]) do
          logger.info(
            message: 'Processing command',
            command_name: 'update_user',
            class_name: self.class.name,
            current_user: payload[:username]
          )

          user_id = payload.delete('remote_user_id')

          return unless user_id.present? && payload.any?

          user = ::User.where(id: user_id).first
          Carto::UserUpdater.new(user).update(payload.except(:request_id))

          logger.info(
            message: 'User updated',
            current_user: user,
            class_name: self.class.name,
          )
        end
      end

      def create_user(payload)
        logger.info(debug_tag: 'amiedes', message: 'Processing CentralUserCommands#create_user', current_user: payload[:username], payload: payload)

        Carto::Common::CurrentRequest.with_request_id(payload[:request_id]) do
          logger.info(
            message: 'Processing command',
            command_name: 'create_user',
            class_name: self.class.name,
            current_user: payload[:username]
          )

          logger.info(debug_tag: 'amiedes', message: 'Before the Carto::UserCreator.new.create', current_user: payload[:username])

          user = Carto::UserCreator.new.create(payload.except(:request_id))

          logger.info(debug_tag: 'amiedes', message: 'After the Carto::UserCreator.new.create', current_user: payload[:username])
          logger.info(debug_tag: 'amiedes', message: 'After the Carto::UserCreator.new.create', full_user: user.inspect)

          notifications_topic.publish(:user_created, {
                                        username: user.username,
                                        id: user.id
                                      })

          logger.info(debug_tag: 'amiedes', message: 'After publishing the user_created message', current_user: payload[:username])

          logger.info(message: 'User created', current_user: user, class_name: self.class.name)
        end
      rescue StandardError => e
        logger.error(debug_tag: 'amiedes', message: 'Unhandled exception', exception: e)
        raise e
      end

      def delete_user(payload)
        Carto::Common::CurrentRequest.with_request_id(payload[:request_id]) do
          logger.info(
            message: 'Processing command',
            command_name: 'delete_user',
            class_name: self.class.name,
            user_id: payload[:id]
          )

          user = ::User.where(id: payload[:id]).first
          user.set_force_destroy if payload[:force] == 'true'
          user.destroy
          notifications_topic.publish(:user_deleted, { username: user.username })
          logger.info(message: 'User deleted', current_user: user.username, class_name: self.class.name)
        end
      rescue CartoDB::SharedEntitiesError
        Carto::Common::CurrentRequest.with_request_id(payload[:request_id]) do
          notifications_topic.publish(:user_could_not_be_deleted, {
                                        username: user.username,
                                        reason: 'user has shared entities'
                                      })
          logger.info(
            message: 'User could not be deleted because it has shared entities',
            class_name: self.class.name,
            current_user: user.username
          )
        end
      end

    end
  end
end

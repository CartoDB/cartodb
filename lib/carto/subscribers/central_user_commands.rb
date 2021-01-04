require './lib/carto/user_creator'
require './lib/carto/user_updater'

module Carto
  module Subscribers
    class CentralUserCommands < ::Carto::Subscribers::Base

      def update_user(payload)
        Carto::Common::CurrentRequest.with_request_id(payload[:request_id]) do
          logger.info(message: 'Processing :update_user', class_name: self.class.name)

          user_id = payload.delete('remote_user_id')

          return unless user_id.present? && payload.any?

          user = ::User.where(id: user_id).first
          Carto::UserUpdater.new(user).update(payload.except(:request_id))

          logger.info(message: 'User updated', current_user: user, class_name: self.class.name)
        end
      end

      def create_user(payload)
        Carto::Common::CurrentRequest.with_request_id(payload[:request_id]) do
          logger.info(message: 'Processing :create_user', class_name: self.class.name)

          user = Carto::UserCreator.new.create(payload.except(:request_id))
          notifications_topic.publish(:user_created, {
                                        username: user.username,
                                        id: user.id
                                      })

          logger.info(message: 'User created', current_user: user, class_name: self.class.name)
        end
      end

      def delete_user(payload)
        Carto::Common::CurrentRequest.with_request_id(payload[:request_id]) do
          logger.info(message: 'Processing :delete_user', class_name: self.class.name)

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

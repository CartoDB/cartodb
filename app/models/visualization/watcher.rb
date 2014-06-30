# encoding: utf-8

require_relative './member'

# TODO: Migrate to new redis gem?
module CartoDB
  module Visualization
    class Watcher

      # watcher:_orgid_:_vis_id_:_user_id_
      KEY_FORMAT = "watcher:%s:%s:%s"

      # TTL in secs that
      DEFAULT_NOTIFICATION_TTL = 60

      # @params user User
      # @params visualization CartoDB::Visualization::Member
      # @throws CartoDB::Visualization::WatcherError
      def initialize(user, visualization, notification_ttl = DEFAULT_NOTIFICATION_TTL)
        raise WatcherError.new('User must belong to an organization') if user.organization.nil?
        @user = user
        @visualization = visualization
        @notification_ttl = notification_ttl
      end #initialize

      # Notifies that is editing the visualization
      # NOTE: Expiration is handled internally by redis
      def notify
        key = KEY_FORMAT % [@user.organization.id, @visualization.id, @user.username]
        $tables_metadata.multi do
          $tables_metadata.set(key, @user.username)
          $tables_metadata.expire(key, @notification_ttl)
        end
      end

      # Returns a list of usernames currently editing the visualization
      def list
        key = KEY_FORMAT % [@user.organization.id, @visualization.id, '*']
        keys = $tables_metadata.keys(key)
        if keys.empty?
          []
        else
          # Cannot use MGET directly
          $tables_metadata.multi do
            keys.each { |k| $tables_metadata.get(k) }
          end
        end
      end

    end

    class WatcherError < StandardError; end

  end
end
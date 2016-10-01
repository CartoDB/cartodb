# encoding: utf-8

require_relative './member'

module CartoDB
  module Visualization
    class Watcher

      # watcher:_orgid_:_vis_id_:_user_id_
      KEY_FORMAT = "watcher:%s".freeze

      # @params user ::User
      # @params visualization CartoDB::Visualization::Member
      # @throws CartoDB::Visualization::WatcherError
      def initialize(user, visualization, notification_ttl = nil)
        raise WatcherError.new('User must belong to an organization') if user.organization.nil?
        @user = user
        @visualization = visualization

        default_ttl = Cartodb.config[:watcher].present? ? Cartodb.config[:watcher].try("fetch", 'ttl', 60) : 60
        @notification_ttl = notification_ttl.nil? ? default_ttl : notification_ttl
      end

      # Notifies that is editing the visualization
      # NOTE: Expiration is handled internally by redis
      def notify
        key = KEY_FORMAT % @visualization.id
        $tables_metadata.multi do
          $tables_metadata.hset(key, @user.username, current_timestamp + @notification_ttl)
          $tables_metadata.expire(key, @notification_ttl)
        end
      end

      # Returns a list of usernames currently editing the visualization
      def list
        key = KEY_FORMAT % @visualization.id
        users_expiry = $tables_metadata.hgetall(key)
        now = current_timestamp
        users_expiry.select { |_, expiry| expiry.to_i > now }.keys
      end

      private

      def current_timestamp
        Time.now.getutc.to_i
      end
    end

    class WatcherError < BaseCartoDBError; end
  end
end

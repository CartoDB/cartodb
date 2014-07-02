# encoding: utf-8

require_relative './member'

module CartoDB
  module Visualization
    class Watcher

      # watcher:_orgid_:_vis_id_:_user_id_
      KEY_FORMAT = "watcher:%s:%s:%s"

      # @params user User
      # @params visualization CartoDB::Visualization::Member
      # @throws CartoDB::Visualization::WatcherError
      def initialize(user, visualization, notification_ttl = nil)
        raise WatcherError.new('User must belong to an organization') if user.organization.nil?
        @user = user
        @visualization = visualization
        @notification_ttl = notification_ttl.nil? ? Cartodb.config[:watcher].try("fetch", 'ttl', 60) : notification_ttl
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
          $tables_metadata.multi {
            keys.each { |k| $tables_metadata.get(k) }
          }.flatten.compact
        end
      end

    end

    class WatcherError < BaseCartoDBError; end

  end
end
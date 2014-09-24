# encoding: utf-8

require_relative './member'

module CartoDB
  module Visualization
    class Watcher

      # watcher:_orgid_:_vis_id_
      KEY_FORMAT = "watcher:%s:%s"

      # @params user User
      # @params visualization CartoDB::Visualization::Member
      # @throws CartoDB::Visualization::WatcherError
      def initialize(user, visualization)
        raise WatcherError.new('User must belong to an organization') if user.organization.nil?
        @user = user
        @visualization = visualization

        @notification_ttl = Cartodb.config[:watcher].present? ? Cartodb.config[:watcher].try("fetch", 'ttl', 60) : 60
      end

      # Notifies that is editing the visualization
      # NOTE: Expiration is handled in rake task
      def notify
        $tables_metadata.zadd(key, Time.now.utc.to_i, @user.username)
      end

      # Returns a list of usernames currently editing the visualization
      def list
        now = Time.now.utc.to_i
        $tables_metadata.zrangebyscore(key, now - @notification_ttl, now)
      end

      def prune
        $tables_metadata.zremrangebyscore(key, 0, Time.now.utc.to_i - @notification_ttl)
      end

      private

      def key
        KEY_FORMAT % [@user.organization.id, @visualization.id]
      end

    end

    class WatcherError < BaseCartoDBError; end

  end
end
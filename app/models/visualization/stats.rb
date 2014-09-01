# encoding: utf-8

module CartoDB
  module Visualization
    class Stats
      def initialize(visualization, user=nil)
        @visualization  = visualization
        @user           = user || visualization.user
      end
      
      def to_poro
        data_points = (0..29).map do |t|
          date = Date.today - (29 - t).days
          [ date.iso8601,
            $users_metadata.ZSCORE(visualization_stats_key, date.strftime("%Y%m%d")).to_i ]
        end
        Hash[data_points]
      end

      # Specifications here:
      # https://github.com/Vizzuality/Windshaft-cartodb/wiki/Redis-stats-format
      def visualization_stats_key
        "user:#{user.username}:mapviews:stat_tag:#{visualization.id}"
      end

      private

      attr_reader :visualization, :user
    end # Stats
  end # Visualization
end # CartoDB
  

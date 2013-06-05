# encoding: utf-8

module CartoDB
  module Visualization
    class Stats
      def initialize(visualization)
        @visualization = visualization
      end #initialize
      
      def to_poro
        data_points = (29..0).map do |t|
          date = Date.today - t.days
          [ date.iso8601,
            $users_metadata.ZSCORE(visualization_stats_key, date.strftime("%Y%m%d")).to_i ]
        end
        Hash[data_points]
      end #to_poro

      # Specifications here:
      # https://github.com/Vizzuality/Windshaft-cartodb/wiki/Redis-stats-format
      def visualization_stats_key
        "user:#{@visualization.user.username}:mapviews:stat_tag:#{@visualization.id}"
      end

      private

      attr_reader :member

    end # Stats
  end # Visualization
end # CartoDB
  

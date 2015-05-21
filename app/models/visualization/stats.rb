# encoding: utf-8
require 'date'

module CartoDB
  module Visualization
    class Stats

      def self.mapviews(stats)
        stats.collect { |o| o[1] }.reduce(:+)
      end

      def initialize(visualization, user=nil)
        @visualization  = visualization
        @user           = user || visualization.user
      end
      
      def to_poro
        new_calls = {}
        CartoDB::Stats::APICalls.new.get_api_calls_with_dates(user.username, {stat_tag: visualization.id}).to_a.reverse.each do |call|
          call_date = Date.parse(call[0]).strftime("%Y-%m-%d")
          new_calls[call_date] = call[1]
        end
        return new_calls
      end

      def total_mapviews
        CartoDB::Stats::APICalls.new.get_total_api_calls(user.username, visualization.id)
      end

      private

      attr_reader :visualization, :user
    end # Stats
  end # Visualization
end # CartoDB
  

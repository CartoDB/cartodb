# encoding: utf-8

module CartoDB
  module Visualization
    class Stats
      def initialize(visualization)
        @visualization = visualization
      end #initialize
      
      def to_poro
        data_points = (1..30).map do |i| 
          time    = Time.at(Time.now.to_i - (86400 * (31 - i)))
          [convert_to_iso8601(time), rand(999) ]
        end
        Hash[data_points]
      end #to_poro

      private

      attr_reader :member

      def convert_to_iso8601(time)
        seconds = time.sec + Rational(time.usec, 10**6)
        offset  = Rational(time.utc_offset, 60 * 60 * 24)

        DateTime.new(time.year, time.month, time.day, time.hour,
                    time.min, seconds, offset).iso8601
      end #convert_to_iso8601
    end # Stats
  end # Visualization
end # CartoDB
  

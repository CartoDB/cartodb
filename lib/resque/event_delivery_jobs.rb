require_relative  '../cartodb/segment_tracker'

module Resque
  module EventDeliveryJobs

    module Test
      @queue = :tracker
        
      def self.perform(name)
        File.open("/home/jmartin/#{name}.txt", 'w') do |f2|
          f2.puts "yeaaaaaaah"
        end
      end
    end

    module TrackEvent
      @queue = :tracker

      def self.perform(user_id, event_name, properties)
        tracker = Cartodb::SegmentTracker.new
        tracker.track_event(user_id, 
                            event_name, 
                            properties)
        tracker.flush
      end
    end

  end
end

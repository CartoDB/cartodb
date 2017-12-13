module Carto
  module Tracking
    module Services
      module Segment
        def report_to_segment
          return unless segment_api_key

          segment_job = Resque::TrackingJobs::SendSegmentEvent
          supplied_properties = @format.to_segment

          Resque.enqueue(segment_job, @reporter.try(:id), name, supplied_properties)
        end

        def segment_api_key
          @segment_api_key ||= Cartodb.get_config(:segment, 'api_key')
        end
      end
    end
  end
end

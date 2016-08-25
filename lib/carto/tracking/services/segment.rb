module Carto
  module Tracking
    module Services
      module Segment
        def report_to_segment
          return unless segment_enabled?

          segment_job = Resque::TrackingJobs::SendSegmentEvent
          supplied_properties = @format.to_segment

          Resque.enqueue(segment_job, supplied_properties[:user_id], name, supplied_properties)
        end

        def segment_enabled?
          Cartodb.config[:segment].present?
        end
      end
    end
  end
end

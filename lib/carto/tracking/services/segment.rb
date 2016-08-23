module Carto
  module Tracking
    module Services
      module Segment
        def report_to_segment
          return unless segment_enabled?

          segment_job = Resque::TrackingJobs::SendSegmentEvent
          properties = @format.to_segment
          user_id = @format.to_hash[:user_id]

          raise 'Segment requires a user_id for reporting' unless user_id

          Resque.enqueue(segment_job, user_id, name, properties)
        end

        def segment_enabled?
          Cartodb.config[:segment].present?
        end
      end
    end
  end
end
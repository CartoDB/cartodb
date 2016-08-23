# encoding utf-8

require_dependency 'carto/tracking/formats/carto_api'

module Carto
  module Tracking
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

    module Events
      class Event
        def initialize(properties)
          @format = Carto::Tracking::Formats::CartoApi.new(properties)
        end

        def name
          self.class.name.demodulize.underscore.humanize.capitalize
        end

        def report
          methods.select { |method_name| method_name =~ /^report_to/ }.each do |report_method|
            send(report_method)
          end
        end
      end

      class ExportedMap < Event
        include Carto::Tracking::Segment
      end

      class CreatedMap < Event
        include Carto::Tracking::Segment
      end

      class DeletedMap < Event
        include Carto::Tracking::Segment
      end

      class PublishedMap < Event
        include Carto::Tracking::Segment
      end

      class CompletedConnection < Event
        include Carto::Tracking::Segment
      end

      class FailedConnection < Event
        include Carto::Tracking::Segment
      end

      class ExceededQuota < Event
        include Carto::Tracking::Segment
      end

      class ScoredTrendingMap < Event
        include Carto::Tracking::Segment
      end

      class VisitedPrivatePage < Event
        include Carto::Tracking::Segment
      end

      class CreatedDataset < Event
        include Carto::Tracking::Segment
      end

      class DeletedDataset < Event
        include Carto::Tracking::Segment
      end

      class LikedMap < Event
        include Carto::Tracking::Segment
      end

      class DislikedMap < Event
        include Carto::Tracking::Segment
      end
    end
  end
end

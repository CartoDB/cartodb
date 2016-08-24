# encoding utf-8

require_dependency 'carto/tracking/formats/internal'
require_dependency 'carto/tracking/services/segment'

module Carto
  module Tracking
    module Events
      class Event
        def initialize(properties)
          @format = Carto::Tracking::Formats::Internal.new(properties)
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
        include Carto::Tracking::Services::Segment
      end

      class CreatedMap < Event
        include Carto::Tracking::Services::Segment
      end

      class DeletedMap < Event
        include Carto::Tracking::Services::Segment
      end

      class PublishedMap < Event
        include Carto::Tracking::Services::Segment
      end

      class CompletedConnection < Event
        include Carto::Tracking::Services::Segment
      end

      class FailedConnection < Event
        include Carto::Tracking::Services::Segment
      end

      class ExceededQuota < Event
        include Carto::Tracking::Services::Segment
      end

      class ScoredTrendingMap < Event
        include Carto::Tracking::Services::Segment
      end

      class VisitedPrivatePage < Event
        include Carto::Tracking::Services::Segment
      end

      class CreatedDataset < Event
        include Carto::Tracking::Services::Segment
      end

      class DeletedDataset < Event
        include Carto::Tracking::Services::Segment
      end

      class LikedMap < Event
        include Carto::Tracking::Services::Segment
      end

      class DislikedMap < Event
        include Carto::Tracking::Services::Segment
      end
    end
  end
end

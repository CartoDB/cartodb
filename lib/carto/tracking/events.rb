# encoding utf-8

module Carto
  module Tracking
    module Segment
      def report_to_segment
        segment_job = Resque::TrackingJobs::SendSegmentEvent

        Resque.enqueue(segment_job, name, @format.to_segment)
      end
    end

    module Events
      class Event
        def initialize(format)
          @format = format
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

      class VisitedPrivateBuilder < Event
        include Carto::Tracking::Segment
      end

      class VisitedPrivateDashboard < Event
        include Carto::Tracking::Segment
      end

      class VisitedPrivateDataset < Event
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

      #   class MapLiking < Event
      #     def initialize(user, visualization, action)
      #       super(user, 'Liked map', properties(visualization, action))
      #     end

      #     private

      #     def properties(visualization, action)
      #       visualization_user = visualization.user
      #       {
      #         action: action,
      #         vis_id: visualization.id,
      #         vis_name: visualization.name,
      #         vis_type: visualization.type == 'derived' ? 'map' : 'dataset',
      #         vis_author: visualization_user.username,
      #         vis_author_email: visualization_user.email,
      #         vis_author_id: visualization_user.id
      #       }
      #     end
      #   end

      #   class LikedMap < MapLiking
      #     def initialize(user, visualization)
      #       super(user, visualization, 'like')
      #     end
      #   end

      #   class DislikedMap < MapLiking
      #     def initialize(user, visualization)
      #       super(user, visualization, 'remove')
      #     end
      #   end

      #   class CreatedVisualizationFactory
      #     def self.build(user, visualization, origin: 'blank')
      #       if visualization.derived?
      #         Carto::Tracking::Events::CreatedMap.new(user, visualization, origin: origin)
      #       else
      #         Carto::Tracking::Events::CreatedDataset.new(user, visualization, origin: origin)
      #       end
      #     end
      #   end

      #   class DeletedVisualizationFactory
      #     def self.build(user, visualization)
      #       if visualization.derived?
      #         Carto::Tracking::Events::DeletedMap.new(user, visualization)
      #       else
      #         Carto::Tracking::Events::DeletedDataset.new(user, visualization)
      #       end
      #     end
      #   end

      #   class ConnectionFactory
      #     def self.build(user, result: nil, data_from: '', imported_from: '', sync: false)
      #       parameters = {
      #         result: result,
      #         data_from: data_from,
      #         imported_from: imported_from,
      #         sync: sync
      #       }

      #       if result.success?
      #         Carto::Tracking::Events::CompletedConnection.new(user, parameters)
      #       else
      #         Carto::Tracking::Events::FailedConnection.new(user, parameters)
      #       end
      #     end
      #   end
#       end
#     end
#   end
# end

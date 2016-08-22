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
    end
  end
end

      # module Segment
      #   class Event
      #     def initialize(user, name, properties)
      #       @user = user
      #       @name = name
      #       @properties = properties
      #     end

      #     def report
      #       Carto::Tracking::SegmentWrapper.new.send_event(@user, @name, @properties.merge(event_properties))
      #     rescue => exception
      #       CartoDB::Logger.warning(message: 'Carto::Tracking: Event couldn\'t be reported',
      #                               exception: exception,
      #                               properties: @properties,
      #                               user: @user)
      #     end

      #     private

      #     def event_properties
      #       now = Time.now.utc

      #       properties = user_properties(@user, now: now)
      #       properties.merge(event_origin: 'Editor', creation_time: now)
      #     end
      #   end

      #   class ExportedMap < Event
      #     def initialize(user, visualization)
      #       super(user, 'Exported map', visualization_properties(visualization))
      #     end
      #   end

      #   class CreatedMap < Event
      #     def initialize(user, visualization, origin: 'blank')
      #       super(user, 'Created map', visualization_properties(visualization, origin: origin))
      #     end
      #   end

      #   class DeletedMap < Event
      #     def initialize(user, visualization)
      #       super(user, 'Deleted map', visualization_properties(visualization))
      #     end
      #   end

      #   class PublishedMap < Event
      #     def initialize(user, visualization)
      #       super(user, 'Published map', visualization_properties(visualization))
      #     end
      #   end

      #   class ConnectionEvent < Event
      #     def initialize(user, name, result, data_from, imported_from, sync)
      #       super(user, name, properties(result, data_from, imported_from, sync))
      #     end

      #     private

      #     def properties(result, data_from, imported_from, sync)
      #       properties = { data_from: data_from, imported_from: imported_from, sync: sync }

      #       properties[:file_type] = result.extension if result

      #       properties
      #     end
      #   end

      #   class CompletedConnection < ConnectionEvent
      #     def initialize(user, result: nil, data_from: '', imported_from: '', sync: false)
      #       super(user, 'Completed connection', result, data_from, imported_from, sync)
      #     end
      #   end

      #   class FailedConnection < ConnectionEvent
      #     def initialize(user, result: nil, data_from: '', imported_from: '', sync: false)
      #       super(user, 'Failed connection', result, data_from, imported_from, sync)
      #     end
      #   end

      #   class ExceededQuota < Event
      #     def initialize(user, quota_overage: 0)
      #       super(user, 'Exceeded quota', quota_overage > 0 ? { quota_overage: quota_overage } : {})
      #     end
      #   end

      #   class ScoredTrendingMap < Event
      #     def initialize(user, visualization, views)
      #       super(user, 'Scored trending map', properties(visualization, views))
      #     end

      #     private

      #     def properties(visualization, views)
      #       {
      #         map_id: visualization.id,
      #         map_name: visualization.fetch.name,
      #         mapviews: views
      #       }
      #     end
      #   end

      #   class VisitedPrivatePage < Event
      #     def initialize(user, page)
      #       super(user, 'Visited private page', { page: page })
      #     end
      #   end

      #   class VisitedPrivateDashboard < VisitedPrivatePage
      #     def initialize(user)
      #       super(user, 'dashboard')
      #     end
      #   end

      #   class VisitedPrivateBuilder < VisitedPrivatePage
      #     def initialize(user)
      #       super(user, 'builder')
      #     end
      #   end

      #   class VisitedPrivateDataset < VisitedPrivatePage
      #     def initialize(user)
      #       super(user, 'dataset')
      #     end
      #   end

      #   class CreatedDataset < Event
      #     def initialize(user, table_visualization, origin: 'blank')
      #       super(user, 'Created dataset', visualization_properties(table_visualization, origin: origin))
      #     end
      #   end

      #   class DeletedDataset < Event
      #     def initialize(user, table_visualization)
      #       super(user, 'Deleted dataset', visualization_properties(table_visualization))
      #     end
      #   end

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

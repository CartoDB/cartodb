require_dependency 'carto/tracking/segment_wrapper'
require_dependency 'carto/tracking/properties_helper'

module Carto
  module Tracking
    module Events
      include Carto::Tracking::PropertiesHelper

      class TrackingEvent
        def initialize(user, name, properties)
          @user = user
          @name = name
          @properties = properties
        end

        def report
          Carto::Tracking::SegmentWrapper.new(@user).send_event(@name, @properties)
        rescue => exception
          CartoDB::Logger.error(message: 'Carto::Tracking: Event could\'t be reported',
                                exception: exception,
                                properties: @properties,
                                user: @user)
        end
      end

      class ExportedMap < TrackingEvent
        def initialize(user, visualization)
          super(user, 'Exported map', visualization_properties(visualization))
        end
      end

      class CreatedMap < TrackingEvent
        def initialize(user, visualization)
          super(user, 'Created map', visualization_properties(visualization))
        end
      end

      class VisitedDashboard < TrackingEvent
        def initialize(user)
          super(user, 'Visited dashboard', visit_properties(user))
        end
      end

      class VisitedBuilder < TrackingEvent
        def initialize(user)
          super(user, 'Visited builder', visit_properties(user))
        end
      end

      class VisitedDataset < TrackingEvent
        def initialize(user)
          super(user, 'Visited dataset', visit_properties(user))
        end
      end

      class CreatedDataset < TrackingEvent
        def initialize(user, table_visualization, origin: 'blank')
          super(user, 'Created dataset', dataset_properties(table_visualization, origin: origin))
        end
      end

      class DeletedDataset < TrackingEvent
        def initialize(user, table_visualization)
          super(user, 'Deleted dataset', dataset_properties(table_visualization))
        end
      end

      class MapLiking < TrackingEvent
        def initialize(user, visualization, action)
          super(user, 'Liked map', like_properties(visualization, action))
        end
      end

      class LikedMap < MapLiking
        def initialize(user, visualization)
          super(user, visualization, 'like')
        end
      end

      class DislikedMap < MapLiking
        def initialize(user, visualization)
          super(user, visualization, 'remove')
        end
      end
    end
  end
end

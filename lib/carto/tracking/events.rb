require_dependency 'carto/tracking/segment_wrapper'

module Carto
  module Tracking
    module Events
      class ExportedMap
        EVENT_NAME = 'Exported map'.freeze

        def initialize(user, visualization)
          @user = user
          @visualization = visualization
        end

        def report
          Carto::Tracking::SegmentWrapper.new(@user).send_event(EVENT_NAME, properties)
        end

        private

        def properties
          {
            privacy: @visualization.privacy,
            type: @visualization.type,
            id: @visualization.id
          }
        end
      end

      class VisitedDashboard
        EVENT_NAME = 'Visited dashboard'.freeze

        def initialize(user)
          @user = user
        end

        def report
          Carto::Tracking::SegmentWrapper.new(@user).send_event(EVENT_NAME, properties)
        end

        private

        def properties
          {}
        end
      end

      class VisitedBuilder
        EVENT_NAME = 'Visited builder'.freeze

        def initialize(user)
          @user = user
        end

        def report
          Carto::Tracking::SegmentWrapper.new(@user).send_event(EVENT_NAME, properties)
        end

        private

        def properties
          {}
        end
      end

      class CreatedMap
        EVENT_NAME = 'Created map'.freeze

        def initialize(user, visualization)
          @user = user
          @visualization = visualization
        end

        def report
          Carto::Tracking::SegmentWrapper.new(@user).send_event(EVENT_NAME, properties)
        end

        private

        def properties
          {
            privacy: @visualization.privacy,
            type: @visualization.type,
            id: @visualization.id
          }
        end
      end

      class CreatedDataset
        EVENT_NAME = 'Created dataset'.freeze

        def initialize(user, table_visualization, origin: 'blank')
          @user = user
          @table_visualization = table_visualization
          @origin = origin
        end

        def report
          Carto::Tracking::SegmentWrapper.new(@user).send_event(EVENT_NAME, properties)
        end

        private

        def properties
          {
            privacy: @table_visualization.privacy,
            type: @table_visualization.type,
            vis_id: @table_visualization.id,
            origin: @origin
          }
        end
      end

      class DeletedDataset
        EVENT_NAME = 'Deleted dataset'.freeze

        def initialize(user, table_visualization)
          @user = user
          @table_visualization = table_visualization
        end

        def report
          Carto::Tracking::SegmentWrapper.new(@user).send_event(EVENT_NAME, properties)
        end

        private

        def properties
          {
            privacy: @table_visualization.privacy,
            type: @table_visualization.type,
            vis_id: @table_visualization.id
          }
        end
      end

      class LikedMap
        def initialize(user, visualization)
          @user = user
          @visualization = visualization
        end

        def report
          Carto::Tracking::Events::MapLiking.new(@user, @visualization, 'like').report
        end
      end

      class DislikedMap
        def initialize(user, visualization)
          @user = user
          @visualization = visualization
        end

        def report
          Carto::Tracking::Events::MapLiking.new(@user, @visualization, 'remove').report
        end
      end

      class MapLiking
        EVENT_NAME = 'Liked map'.freeze

        def initialize(user, visualization, action)
          @user = user
          @visualization = visualization
          @action = action
        end

        def report
          Carto::Tracking::SegmentWrapper.new(@user).send_event(EVENT_NAME, properties)
        end

        private

        def properties
          visualization_user = @visualization.user
          {
            action: @action,
            vis_id: @visualization.id,
            vis_name: @visualization.name,
            vis_type: @visualization.type == 'derived' ? 'map' : 'dataset',
            vis_author: visualization_user.username,
            vis_author_email: visualization_user.email,
            vis_author_id: visualization_user.id
          }
        end
      end
    end
  end
end

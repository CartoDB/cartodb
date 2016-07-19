require_dependency 'carto/tracking/segment_wrapper'

module Carto
  module Tracking
    module PropertiesHelper
      def visualization_properties(visualization)
        {
          id: visualization.id,
          privacy: visualization.privacy,
          type: visualization.type
        }
      end

      def user_properties(user)
        {
          username: user.username,
          email: user.email,
          plan: user.account_type,
          organization: (user.organization_user? ? user.organization.name : nil)
        }
      end

      def dataset_properties(table_visualization, origin: nil)
        properties = {
          vis_id: table_visualization.id,
          privacy: table_visualization.privacy,
          type: table_visualization.type
        }

        properties.merge(origin: origin) if origin

        properties
      end

      def like_properties(visualization, action)
        visualization_user = visualization.user
        {
          action: action,
          vis_id: visualization.id,
          vis_name: visualization.name,
          vis_type: visualization.type == 'derived' ? 'map' : 'dataset',
          vis_author: visualization_user.username,
          vis_author_email: visualization_user.email,
          vis_author_id: visualization_user.id
        }
      end

      def properties_context(event_origin: 'Editor')
        {
          event_origin: event_origin,
          creation_time: Time.now.utc
        }
      end

      def visit_properties(user, page)
        { page: page }.merge(user_properties(user)).merge(properties_context)
      end
    end

    module Events
      class TrackingEvent
        include Carto::Tracking::PropertiesHelper

        def initialize(user, name, properties)
          @user = user
          @name = name
          @properties = properties
        end

        def report
          Carto::Tracking::SegmentWrapper.new(@user).send_event(@name, @properties)
        rescue => exception
          CartoDB::Logger.warning(message: 'Carto::Tracking: Event couldn\'t be reported',
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

      class VistedPage < TrackingEvent
        def initialize(user, page)
          super(user, 'Visited dashboard', visit_properties(user, page))
        end
      end

      class VisitedDashboard < VistedPage
        def initialize(user)
          super(user, 'dashboard')
        end
      end

      class VisitedBuilder < VistedPage
        def initialize(user)
          super(user, 'builder')
        end
      end

      class VisitedDataset < VistedPage
        def initialize(user)
          super(user, 'dashboard')
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

require_dependency 'carto/tracking/segment_wrapper'

module Carto
  module Tracking
    module PropertiesHelper
      def visualization_properties(visualization, origin: nil)
        created_at = visualization.created_at
        lifetime_in_days_with_decimals = days_with_decimals(Time.now.utc - created_at)

        properties = {
          vis_id: visualization.id,
          privacy: visualization.privacy,
          type: visualization.type,
          object_created_at: created_at,
          lifetime: lifetime_in_days_with_decimals
        }

        properties[:origin] = origin if origin

        properties
      end

      def days_with_decimals(time_object)
        time_object.to_f / 60 / 60 / 24
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
          Carto::Tracking::SegmentWrapper.new.send_event(@user, @name, @properties.merge(event_properties))
        rescue => exception
          CartoDB::Logger.warning(message: 'Carto::Tracking: Event couldn\'t be reported',
                                  exception: exception,
                                  properties: @properties,
                                  user: @user)
        end

        private

        def event_properties
          now = Time.now.utc
          user_created_at = @user.created_at
          user_age_in_days_with_decimals = days_with_decimals(now - user_created_at)

          {
            username: @user ? @user.username : nil,
            email: @user ? @user.email : nil,
            plan: @user ? @user.account_type : nil,
            user_active_for: user_age_in_days_with_decimals,
            user_created_at: user_created_at,
            organization: @user && @user.organization_user? ? @user.organization.name : nil,
            event_origin: 'Editor',
            creation_time: now
          }
        end
      end

      class ExportedMap < TrackingEvent
        def initialize(user, visualization)
          super(user, 'Exported map', visualization_properties(visualization))
        end
      end

      class CreatedMap < TrackingEvent
        def initialize(user, visualization, origin: 'blank')
          super(user, 'Created map', visualization_properties(visualization, origin: origin))
        end
      end

      class DeletedMap < TrackingEvent
        def initialize(user, visualization)
          super(user, 'Deleted map', visualization_properties(visualization))
        end
      end

      class PublishedMap < TrackingEvent
        def initialize(user, visualization)
          super(user, 'Published map', visualization_properties(visualization))
        end
      end

      class ExceededQuota < TrackingEvent
        def initialize(user, quota_overage: 0)
          super(user, 'Exceeded quota', quota_overage > 0 ? { quota_overage: quota_overage } : {})
        end
      end

      class ScoredTrendingMap < TrackingEvent
        def initialize(user, visualization, views)
          super(user, 'Scored trending map', properties(visualization, views))
        end

        private

        def properties(visualization, views)
          {
            map_id: visualization.id,
            map_name: visualization.fetch.name,
            mapviews: views
          }
        end
      end

      class VisitedPrivatePage < TrackingEvent
        def initialize(user, page)
          super(user, 'Visited private page', { page: page })
        end
      end

      class VisitedPrivateDashboard < VisitedPrivatePage
        def initialize(user)
          super(user, 'dashboard')
        end
      end

      class VisitedPrivateBuilder < VisitedPrivatePage
        def initialize(user)
          super(user, 'builder')
        end
      end

      class VisitedPrivateDataset < VisitedPrivatePage
        def initialize(user)
          super(user, 'dataset')
        end
      end

      class CreatedDataset < TrackingEvent
        def initialize(user, table_visualization, origin: 'blank')
          super(user, 'Created dataset', visualization_properties(table_visualization, origin: origin))
        end
      end

      class DeletedDataset < TrackingEvent
        def initialize(user, table_visualization)
          super(user, 'Deleted dataset', visualization_properties(table_visualization))
        end
      end

      class MapLiking < TrackingEvent
        def initialize(user, visualization, action)
          super(user, 'Liked map', properties(visualization, action))
        end

        private

        def properties(visualization, action)
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

      class CreatedVisualizationFactory
        def self.build(user, visualization, origin: 'blank')
          if visualization.derived?
            Carto::Tracking::Events::CreatedMap.new(user, visualization, origin: origin)
          else
            Carto::Tracking::Events::CreatedDataset.new(user, visualization, origin: origin)
          end
        end
      end

      class DeletedVisualizationFactory
        def self.build(user, visualization)
          if visualization.derived?
            Carto::Tracking::Events::DeletedMap.new(user, visualization)
          else
            Carto::Tracking::Events::DeletedDataset.new(user, visualization)
          end
        end
      end
    end
  end
end

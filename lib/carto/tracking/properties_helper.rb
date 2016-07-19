module Carto
  module Tracking
    module Properties
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

      def visit_properties(user)
        user_properties(user).merge(properties_context)
      end
    end
  end
end
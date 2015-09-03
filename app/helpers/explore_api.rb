# encoding: utf-8

module Helpers
  class ExploreAPI

      VISUALIZATIONS_COLUMNS = ['visualization_id', 'visualization_name', 'visualization_description', 'visualization_type', 'visualization_synced',
                              'visualization_table_names', 'visualization_tags', 'visualization_bbox', 'visualization_view_box',
                              'visualization_view_box_center', 'visualization_zoom', 'visualization_created_at', 'visualization_updated_at',
                              'visualization_map_id', 'visualization_title', 'visualization_likes', 'visualization_mapviews', 'user_id',
                              'user_username', 'user_organization_id', 'user_twitter_username', 'user_website', 'user_avatar_url',
                              'user_available_for_hire']

      def get_visualization_tables(visualization)
        # We are using layers instead of related tables because with related tables we are connecting
        # to the users databases and we are reaching the connections limit
        table_names = visualization.layers(:carto_and_torque).map { |layer| extract_table_name(layer) }
        %Q{{#{table_names.compact.join(",")}}}
      end

      def get_geometry_data(visualization)
        map = visualization.map
        view_box = map.view_bounds_data
        center_coordinates = map.center_data.reverse
        {
          zoom: map.zoom,
          view_box_polygon: BoundingBoxHelper.to_polygon(view_box[:west], view_box[:south], view_box[:east], view_box[:north]),
          center_geometry: BoundingBoxHelper.to_point(center_coordinates[0], center_coordinates[1])
        }
      end

      def get_visualizations_values_for_insert(visualizations, bbox_values)
        visualizations_values = []
        visualizations.each do |v|
          u = v.user

          tags = %Q[{#{v.tags.join(",")}}]
          tables = get_visualization_tables(v)
          geometry_data = get_geometry_data(v)
          organization_id = u.organization_id.nil? ? 'NULL' : "'#{u.organization_id}'"
          bbox = !bbox_values[v.id].nil? ? "ST_AsText('#{bbox_values[v.id]}')" : 'NULL'

          # Insert values built based in the coulmn order from VISUALIZATIONS_COLUMNS
          visualizations_values.push "('#{v.id}', '#{v.name}', '#{v.description}','#{v.type}',"\
          "'#{!v.synchronization.is_a?(Hash)}', '#{tables}', '#{tags}', #{bbox}, #{geometry_data[:view_box_polygon]},"\
          "#{geometry_data[:center_geometry]}, #{geometry_data[:zoom]},"\
          "'#{v.created_at}', '#{v.updated_at}', '#{v.map_id}','#{v.title}',#{v.likes_count},"\
          "#{v.mapviews}, '#{u.id}', '#{u.username}', #{organization_id}, '#{u.twitter_username}',"\
          "'#{u.website}', '#{u.avatar_url}', '#{u.available_for_hire}')"
        end
        visualizations_values
      end

      private

      def extract_table_name(layer)
        table_username = layer.options['user_name']
        table_name = layer.options['table_name'].gsub(/"/,'\"').split('.')
        # Here we check for:
        #   a) return as comes, but escaping quotes, if the table_name have a . this means an old format username.tablename
        #   b) return username.table_name with the username escaped to avoid problems with non-alphanumeric characters like '-'
        if table_name.length > 1
          %Q[#{layer.options['table_name'].gsub(/"/,'\"')}]
        elsif table_name.length == 1 && !table_username.blank?
          %Q[\\"#{table_username}\\".#{table_name[0]}]
        else
          nil
        end
      end

  end
end

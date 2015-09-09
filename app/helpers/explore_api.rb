# encoding: utf-8

module Helpers
  class ExploreAPI

      def get_visualization_tables(visualization)
        # We are using layers instead of related tables because with related tables we are connecting
        # to the users databases and we are reaching the connections limit
        table_names = visualization.layers(:carto_and_torque).map { |layer| extract_table_name(layer) }.uniq
        %Q{{#{table_names.compact.join(",")}}}
      end

      def get_geometry_data(visualization)
        map = visualization.map
        return {} if map.nil?
        view_box = map.view_bounds_data
        center_coordinates = map.center_data.reverse
        {
          zoom: map.zoom,
          view_box_polygon: BoundingBoxHelper.to_polygon(view_box[:west], view_box[:south], view_box[:east], view_box[:north]),
          center_geometry: BoundingBoxHelper.to_point(center_coordinates[0], center_coordinates[1])
        }
      end

      def bbox_from_value(bbox_value)
        %Q{ST_AsText('#{bbox_value}')}
      end

      def get_table_data(visualization)
        user_table = UserTable.where(user_id: visualization.user_id, name: visualization.name).first
        return {} if user_table.nil?
        {
          rows: user_table.service.rows_counted,
          size: user_table.service.table_size,
          geometry_types: user_table.service.geometry_types
        }
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

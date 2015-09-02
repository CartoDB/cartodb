# encoding: utf-8

module Helpers
  class ExploreAPI

      def get_visualization_tables(visualization)
        # We are using layers instead of related tables because with related tables we are connecting
        # to the users databases and we are reaching the connections limit
        table_names = visualization.layers(:carto_and_torque).map { |layer| extract_table_name(layer) }
        %Q{{#{table_names.compact.join(",")}}}
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

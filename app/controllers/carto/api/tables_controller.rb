module Carto

  module Api

    class TablesController < ::Api::ApplicationController

      ssl_required :show

      def show
        return head(404) if table == nil
        return head(403) unless table.table_visualization.has_permission?(current_user, CartoDB::Visualization::Member::PERMISSION_READONLY)
        render_jsonp(table.public_values({request:request}, current_user).merge(schema: table.schema(reload: true)))
      end

      private

      def table
        @table ||= ::Table.get_by_id_or_name(params.fetch('id'), current_user)
      end

    end
  end
end

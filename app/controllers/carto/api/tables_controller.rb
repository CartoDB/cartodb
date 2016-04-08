# encoding: UTF-8

require_relative '../../../models/carto/permission'
require_relative '../../../models/carto/user_table'

module Carto
  module Api
    class TablesController < ::Api::ApplicationController

      ssl_required :show

      before_filter :set_start_time

      def show
        return head(404) if table == nil
        return head(403) unless table.table_visualization.has_read_permission?(current_user)
        render_jsonp(table.public_values({ request: request }, current_user).merge(schema: table.schema(reload: true)))
      end

      private

      def table
        @table ||= Carto::Helpers::TableLocator.new.get_by_id_or_name(params.fetch('id'), current_user)
        @table
      end

    end
  end
end

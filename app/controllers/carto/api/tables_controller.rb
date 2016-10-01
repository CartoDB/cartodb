# encoding: UTF-8

require_relative '../../../models/carto/permission'
require_relative '../../../models/carto/user_table'

module Carto
  module Api
    class TablesController < ::Api::ApplicationController

      ssl_required :show

      before_filter :set_start_time

      before_filter :load_user_table, only: [:show]
      before_filter :read_privileges?, only: [:show]

      def show
        table = @user_table.service
        render_jsonp(table.public_values({ request: request }, current_user).merge(schema: table.schema(reload: true)))
      end

      private

      def load_user_table
        @user_table = Carto::Helpers::TableLocator.new.get_by_id_or_name(params[:id], current_user)
        raise RecordNotFound unless @user_table
      end

      def read_privileges?
        head(403) unless current_user && @user_table.visualization.is_viewable_by_user?(current_user)
      end
    end
  end
end

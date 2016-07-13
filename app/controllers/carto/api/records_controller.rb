# encoding: UTF-8

require_relative '../../../models/carto/permission'

module Carto
  module Api
    class RecordsController < ::Api::ApplicationController

      ssl_required :show

      before_filter :set_start_time
      before_filter :load_user_table, only: [:show]
      before_filter :read_privileges?, only: [:show]

      # This endpoint is not used by the editor but by users. Do not remove
      def show
        render_jsonp(@user_table.service.record(params[:id]))
      rescue => e
        CartoDB::Logger.error(message: 'Error loading record', exception: e,
                              record_id: params[:id], user_table: @user_table)
        render_jsonp({ errors: ["Record #{params[:id]} not found"] }, 404)
      end

      protected

      def load_user_table
        @user_table = Carto::Helpers::TableLocator.new.get_by_id_or_name(params[:table_id], current_user)
        raise RecordNotFound unless @user_table
      end

      def read_privileges?
        head(401) unless current_user && @user_table.visualization.is_viewable_by_user?(current_user)
      end
    end
  end
end

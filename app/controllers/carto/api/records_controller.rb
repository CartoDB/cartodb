# encoding: UTF-8

require_relative '../../../models/carto/permission'

module Carto
  module Api
    class RecordsController < ::Api::ApplicationController

      ssl_required :show

      before_filter :set_start_time
      before_filter :read_privileges?, only: [:show]

      # This endpoint is not used by the editor but by users. Do not remove
      def show
        render_jsonp(get_record(params[:id]))
      rescue => e
        render_jsonp({ :errors => ["Record #{params[:id]} not found"] }, 404)
      end

      protected

      def get_record(id)
        table.record(id)
      end

      def table
        if @table.nil?
          @table = Carto::Helpers::TableLocator.new.get_by_id_or_name(params[:table_id], current_user)
          raise RecordNotFound if @table.nil?
        end
        @table
      end

      def read_privileges?
        head(401) unless current_user && table.table_visualization.has_read_permission?(current_user)
      end
    end
  end
end

# encoding: UTF-8

require_relative '../../../models/visualization/member'

module Carto
  module Api
    class TablesController < ::Api::ApplicationController

      ssl_required :index, :show

      before_filter :load_table, :set_start_time
      before_filter :read_privileges?, only: [:show]

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
          @table = ::Table.get_by_id_or_name(params[:table_id], current_user)  
          raise RecordNotFound if @table.nil?
        end
        @table
      end

      def read_privileges?
        # TODO: Migrate to new model
        head(401) unless current_user and table.table_visualization.has_permission?(
            current_user, 
            CartoDB::Visualization::Member::PERMISSION_READONLY
          )
      end
    end
  end
end
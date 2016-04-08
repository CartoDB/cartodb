# encoding: UTF-8

require_relative '../../../models/carto/permission'

module Carto
  module Api
    class ColumnsController < ::Api::ApplicationController

      ssl_required :index, :show

      before_filter :read_privileges?, only: [:show]

      def index
        render_jsonp(table.schema(:cartodb_types => true))
      end

      def show
        resp = table.schema(:cartodb_types => true).select{|e| e[0] == params[:id].to_sym}.first.last
        render_jsonp({ :type => resp })
      rescue => e
        render_jsonp({:errors => "Column #{params[:id]} doesn't exist"}, 404) and return
      end

      protected

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

# encoding: UTF-8

module Carto
  module Api
    class ColumnsController < ::Api::ApplicationController

    def index
      render_jsonp(table.schema(:cartodb_types => true))
    end

    protected

    def table
      if @table.nil?
        @table = ::Table.get_by_id_or_name(params[:table_id], current_user)  
        raise RecordNotFound if @table.nil?
      end
      @table
    end

    end
  end
end
# encoding: UTF-8

require_relative '../../../models/carto/permission'

module Carto
  module Api
    class ColumnsController < ::Api::ApplicationController

      ssl_required :index, :show

      before_filter :load_user_table, only: [:index, :show]
      before_filter :read_privileges?, only: [:index, :show]

      def index
        render_jsonp(@user_table.service.schema(cartodb_types: true))
      end

      def show
        resp = @user_table.service.schema(cartodb_types: true).select { |e| e[0] == params[:id].to_sym }.first.last
        render_jsonp(type: resp)
      rescue => e
        CartoDB::Logger.error(message: 'Error loading column', exception: e,
                              column_id: params[:id], user_table: @user_table)
        render_jsonp({ errors: "Column #{params[:id]} doesn't exist" }, 404)
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

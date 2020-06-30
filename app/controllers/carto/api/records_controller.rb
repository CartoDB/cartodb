require_relative '../../../models/carto/permission'

module Carto
  module Api
    class RecordsController < ::Api::ApplicationController
      ssl_required :show, :create, :update, :destroy

      REJECT_PARAMS = %w{ format controller action row_id requestId column_id
                          api_key table_id oauth_token oauth_token_secret api_key user_domain }.freeze

      before_filter :set_start_time
      before_filter :load_user_table, only: [:show, :create, :update, :destroy]
      before_filter :read_privileges?, only: [:show]
      before_filter :write_privileges?, only: [:create, :update, :destroy]

      # This endpoint is not used by the editor but by users. Do not remove
      def show
        render_jsonp(@user_table.service.record(params[:id]))
      rescue StandardError => e
        CartoDB::Logger.error(message: 'Error loading record', exception: e,
                              record_id: params[:id], user_table: @user_table)
        render_jsonp({ errors: ["Record #{params[:id]} not found"] }, :not_found)
      end

      def create
        primary_key = @user_table.service.insert_row!(filtered_row)
        render_jsonp(@user_table.service.record(primary_key))
      rescue StandardError => e
        render_jsonp({ errors: [e.message] }, :bad_request)
      end

      def update
        if params[:cartodb_id].present?
          updated_count = @user_table.service.update_row!(params[:cartodb_id], filtered_row)

          if updated_count.positive?
            render_jsonp(@user_table.service.record(params[:cartodb_id]))
          else
            render_jsonp({ errors: ["row identified with #{params[:cartodb_id]} not found"] }, :not_found)
          end
        else
          render_jsonp({ errors: ["cartodb_id can't be blank"] }, :not_found)
        end
      rescue StandardError => e
        render_jsonp({ errors: [e.message] }, :bad_request)
      end

      def destroy
        id = (params[:cartodb_id] =~ /\A\d+\z/ ? params[:cartodb_id] : params[:cartodb_id].to_s.split(','))
        schema_name = current_user.database_schema
        if current_user.id != @user_table.service.owner.id
          schema_name = @user_table.service.owner.database_schema
        end

        current_user.in_database
                    .select
                    .from(Sequel.qualify(schema_name.to_sym, @user_table.service.name.to_sym))
                    .where(cartodb_id: id)
                    .delete

        head :no_content
      rescue
        render_jsonp({ errors: ["row identified with #{params[:cartodb_id]} not found"] }, :not_found)
      end

      protected

      def filtered_row
        params.reject { |k, _| REJECT_PARAMS.include?(k) }.symbolize_keys
      end

      def load_user_table
        @user_table = Carto::Helpers::TableLocator.new.get_by_id_or_name(params[:table_id], current_user)
        raise RecordNotFound unless @user_table
      end

      def read_privileges?
        head(401) unless current_user && @user_table.visualization.is_viewable_by_user?(current_user)
      end

      def write_privileges?
        head(401) unless current_user && @user_table.visualization.writable_by?(current_user)
      end
    end
  end
end

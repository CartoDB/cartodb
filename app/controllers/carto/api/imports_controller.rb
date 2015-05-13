module Carto
  module Api
    class ImportsController < ::Api::ApplicationController

      ssl_required :index, :show

      def index
        imports = DataImportsService.new.process_recent_user_imports(current_user)
        render json: { imports: imports.map(&:id), success: true }
      end

      def show
        import = DataImportsService.new.process_by_id(params[:id])
        render_404 and return if import.nil?

        data = import.api_public_values
        if import.state == Carto::DataImport::STATE_COMPLETE
          data[:any_table_raster] = import.is_raster?

          decorate_twitter_import_data!(data, import)
          decorate_default_visualization_data!(data, import)
        end

        render json: data
      end

      private

      def decorate_twitter_import_data!(data, data_import)
        return if data_import.service_name != CartoDB::Datasources::Search::Twitter::DATASOURCE_NAME

        audit_entry = ::SearchTweet.where(data_import_id: data_import.id).first
        data[:tweets_georeferenced] = audit_entry.retrieved_items
        data[:tweets_cost] = audit_entry.price
        data[:tweets_overquota] = audit_entry.user.remaining_twitter_quota == 0
      end

      def decorate_default_visualization_data!(data, data_import)
        derived_vis_id = nil

        if data_import.create_visualization && !data_import.visualization_id.nil?
          derived_vis_id = data_import.visualization_id
        end

        data[:derived_visualization_id] = derived_vis_id
      end

    end
  end
end

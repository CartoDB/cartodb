require_dependency 'carto/tracking/events'

module Carto
  module Api
    class VisualizationExportsController < ::Api::ApplicationController
      include VisualizationsControllerHelper

      ssl_required :create, :show, :download

      skip_before_filter :api_authorization_required, only: [:create, :show, :download]
      before_filter :optional_api_authorization, only: [:create, :show, :download]

      before_filter :load_visualization, only: :create
      before_filter :load_visualization_export, only: [:show, :download]

      rescue_from Carto::LoadError, with: :rescue_from_carto_error
      rescue_from Carto::UnauthorizedError, with: :rescue_from_carto_error
      rescue_from Carto::UnprocesableEntityError, with: :rescue_from_carto_error

      def create
        user = current_viewer ? Carto::User.find(current_viewer.id) : nil
        visualization_export = Carto::VisualizationExport.new(
          visualization: @visualization,
          user: user,
          user_tables_ids: params[:user_tables_ids])
        unless visualization_export.save
          if visualization_export.errors[:user].present?
            raise Carto::UnauthorizedError.new("Errors: #{visualization_export.errors.full_messages}")
          else
            log_warning(
              message: 'Error creating visualization export',
              current_user: user,
              visualization: @visualization.attributes.slice(:id),
              user_tables_ids: params[:user_tables_ids],
              visualization_export: visualization_export.attributes.slice(:id)
                                                        .merge(errors: visualization_export.errors.full_messages)
            )
            raise Carto::UnprocesableEntityError.new("Errors: #{visualization_export.errors.full_messages}")
          end
        end

        # In order to generate paths you need to be in a controller, so path is sent to Resque
        download_path_params = { visualization_export_id: visualization_export.id }
        download_path = CartoDB.path(self, 'visualization_export_download', download_path_params)
        Resque.enqueue(Resque::ExporterJobs, job_id: visualization_export.id, download_path: download_path)

        if current_viewer
          current_viewer_id = current_viewer.id
          Carto::Tracking::Events::ExportedMap.new(current_viewer_id,
                                                   user_id: current_viewer_id,
                                                   visualization_id: @visualization.id).report
        end

        render_jsonp(VisualizationExportPresenter.new(visualization_export).to_poro, 201)
      end

      def show
        render_jsonp(VisualizationExportPresenter.new(@visualization_export).to_poro, 200)
      end

      def download
        send_file @visualization_export.file, type: "application/zip"
      end

      private

      def load_visualization
        visualization_id = params[:visualization_id]
        @visualization = Carto::Visualization.where(id: visualization_id).first
        raise Carto::LoadError.new("Visualization not found: #{visualization_id}") unless @visualization
      end

      def load_visualization_export
        id = params[:id].present? ? uuid_parameter(:id) : uuid_parameter(:visualization_export_id)
        @visualization_export = Carto::VisualizationExport.where(id: id).first
        raise Carto::LoadError.new("Visualization export not found: #{id}") unless @visualization_export
        export_user_id = @visualization_export.user_id
        unless export_user_id.nil? || (current_viewer && export_user_id == current_viewer.id)
          raise Carto::UnauthorizedError.new
        end
      end
    end
  end
end

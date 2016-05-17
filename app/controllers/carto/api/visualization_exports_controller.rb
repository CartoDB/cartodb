# encoding: UTF-8

module Carto
  module Api
    class VisualizationExportsController < ::Api::ApplicationController
      include Carto::ControllerHelper
      include VisualizationsControllerHelper

      ssl_required :create, :show

      before_filter :load_visualization, only: :create
      before_filter :load_visualization_export, only: :show

      rescue_from Carto::LoadError, with: :rescue_from_carto_error
      rescue_from Carto::UnauthorizedError, with: :rescue_from_carto_error
      rescue_from Carto::UnprocesableEntityError, with: :rescue_from_carto_error

      def create
        user = Carto::User.find(current_user.id)
        visualization_export = Carto::VisualizationExport.new(
          visualization: @visualization,
          user: user,
          user_tables_ids: params[:user_tables_ids])
        unless visualization_export.save
          if visualization_export.errors[:user].present?
            raise Carto::UnauthorizedError.new("Errors: #{visualization_export.errors.full_messages}")
          else
            CartoDB::Logger.warning(
              message: 'Validation error creating visualization export',
              user: current_user,
              visualization: @visualization.id,
              user_tables_ids: params[:user_tables_ids],
              visualization_export: visualization_export.inspect,
              error_messages: visualization_export.errors.full_messages
            )
            raise Carto::UnprocesableEntityError.new("Errors: #{visualization_export.errors.full_messages}")
          end
        end

        Resque.enqueue(Resque::ExporterJobs, job_id: visualization_export.id)

        render_jsonp(VisualizationExportPresenter.new(visualization_export).to_poro, 201)
      end

      def show
        render_jsonp(VisualizationExportPresenter.new(@visualization_export).to_poro, 200)
      end

      private

      def load_visualization
        visualization_id = params[:visualization_id]
        @visualization = Carto::Visualization.where(id: visualization_id).first
        raise Carto::LoadError.new("Visualization not found: #{visualization_id}") unless @visualization
      end

      def load_visualization_export
        id = uuid_parameter(:id)
        @visualization_export = Carto::VisualizationExport.where(id: id).first
        raise Carto::LoadError.new("Visualization export not found: #{id}") unless @visualization_export
        raise Carto::UnauthorizedError.new unless @visualization_export.user_id == current_user.id
      end
    end
  end
end

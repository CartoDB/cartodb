# encoding: UTF-8

module Carto
  module Api
    class VisualizationExportsController < ::Api::ApplicationController
      include Carto::ControllerHelper
      include VisualizationsControllerHelper

      ssl_required :create

      before_filter :load_visualization

      rescue_from Carto::LoadError, with: :rescue_from_carto_error
      rescue_from Carto::UnauthorizedError, with: :rescue_from_carto_error

      def create
        visualization_export = Carto::VisualizationExport.new(visualization: @visualization, user: Carto::User.find(current_user.id))
        unless visualization_export.save
          raise Carto::UnauthorizedError.new("Errors: #{visualization_export.errors}")
        end

        Resque.enqueue(Resque::ExporterJobs, job_id: visualization_export.id)

        render_jsonp(VisualizationExportPresenter.new(visualization_export).to_poro, 201)
      end

      private

      def load_visualization
        visualization_id = params[:visualization_id]
        @visualization = load_visualization_from_id_or_name!(visualization_id)
      end
    end
  end
end

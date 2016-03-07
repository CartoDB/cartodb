module Carto
  module Api
    class AnalysesController < ::Api::ApplicationController
      include Carto::ControllerHelper

      ssl_required :show

      before_filter :load_parameters
      before_filter :load_analysis, only: [:show]

      rescue_from Carto::LoadError, with: :rescue_from_carto_error
      rescue_from Carto::UnauthorizedError, with: :rescue_from_carto_error
      rescue_from Carto::UnprocesableEntityError, with: :rescue_from_carto_error

      def show
        render_jsonp(AnalysisPresenter.new(@analysis).to_poro)
      end

      private

      def load_parameters
        @visualization_id = params[:visualization_id]
        @analysis_id = params[:id]
      end

      def load_analysis
        @analysis = Carto::Analysis.find(@analysis_id)
      end

    end
  end
end

require 'carto/api/vizjson3_presenter'

module Carto
  module Editor
    class VisualizationsController < EditorController
      include VisualizationsControllerHelper

      ssl_required :show

      before_filter :load_visualization, only: [:show]

      after_filter :update_user_last_activity, only: [:show]

      layout 'application_editor3'

      def show
        @visualization_data = Carto::Api::VisualizationPresenter.new(@visualization, current_viewer, self).to_poro
        @vizjson = Carto::Api::VizJSON3Presenter.new(@visualization, $tables_metadata)
                                                .to_vizjson(https_request: is_https?)
      end

      private

      def load_visualization
        @visualization = load_visualization_from_id(params[:id])
      end
    end
  end
end

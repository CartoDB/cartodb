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
        @visualization_data = load_visualization_data(@visualization)
        @vizjson = load_vizjson(@visualization)
      end

      private

      def load_visualization
        @visualization = load_visualization_from_id(params[:id])
      end
    end
  end
end

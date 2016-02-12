require 'carto/api/vizjson3_presenter'

module Carto
  module Editor
    class VisualizationsController < EditorController
      include VisualizationsControllerHelper

      ssl_required :show

      before_filter :load_visualization, only: [:show]
      before_filter :load_visualization_data, only: [:show]
      before_filter :load_vizjson, only: [:show]

      after_filter :update_user_last_activity, only: [:show]

      layout 'application_editor3'

      def show
      end
    end
  end
end

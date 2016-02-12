require 'carto/api/vizjson3_presenter'

module Carto
  module Editor
    module Public
      class EmbedsController < PublicController
        include VisualizationsControllerHelper

        before_filter :load_visualization, only: [:show]

        def show
          @visualization_data = load_visualization_data(@visualization)
          byebug
          @vizjson = load_vizjson(@visualization)
        end

        private

        def load_visualization
          @visualization = load_visualization_from_id(params[:id])
        end
      end
    end
  end
end

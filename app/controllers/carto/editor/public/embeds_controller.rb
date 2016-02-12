require 'carto/api/vizjson3_presenter'

module Carto
  module Editor
    module Public
      class EmbedsController < PublicController
        include VisualizationsControllerHelper

        before_filter :load_visualization, only: [:show]
        before_filter :load_visualization_data, only: [:show]
        before_filter :load_vizjson, only: [:show]

        def show
        end
      end
    end
  end
end

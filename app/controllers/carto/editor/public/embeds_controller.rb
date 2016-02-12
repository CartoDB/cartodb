require 'carto/api/vizjson3_presenter'

module Carto
  module Editor
    module Public
      class EmbedsController < PublicController
        include VisualizationsControllerHelper

        layout false

        before_filter :load_visualization, only: [:show]

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
end

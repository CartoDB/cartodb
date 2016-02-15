require 'carto/api/vizjson3_presenter'

module Carto
  module Editor
    module Public
      class EmbedsController < PublicController
        include VisualizationsControllerHelper

        ssl_required :show

        before_filter :load_visualization, only: [:show]
        before_filter :ensure_viewable, only: [:show]

        skip_before_filter :editor_users_only, only: [:show] # This is supposed to be public

        layout false

        def show
          @visualization_data = Carto::Api::VisualizationPresenter.new(@visualization, current_viewer, self).to_poro
          @vizjson = Carto::Api::VizJSON3Presenter.new(@visualization, $tables_metadata)
                                                  .to_vizjson(https_request: is_https?)
        end

        private

        def load_visualization
          @visualization = load_visualization_from_id(params[:visualization_id])
        end

        def ensure_viewable
          return(render 'admin/visualizations/embed_map_error') if @visualization.is_private?
          # return(render 'embed_map_password', layout: 'application_password_layout') if @visualization.password_protected?
        end
      end
    end
  end
end

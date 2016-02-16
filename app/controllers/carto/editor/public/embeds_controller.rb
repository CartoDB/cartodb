require 'carto/api/vizjson3_presenter'

module Carto
  module Editor
    module Public
      class EmbedsController < PublicController
        include VisualizationsControllerHelper

        ssl_required :show

        before_filter :load_visualization, only: [:show, :show_protected]
        before_filter :ensure_viewable, only: [:show]

        skip_before_filter :editor_users_only # This is supposed to be public even in beta

        layout false

        def show
          @visualization_data = Carto::Api::VisualizationPresenter.new(@visualization, current_viewer, self).to_poro
          @vizjson = Carto::Api::VizJSON3Presenter.new(@visualization, $tables_metadata)
                                                  .to_vizjson(https_request: is_https?)

          render 'show'
        end

        def show_protected
          show if @visualization.password_valid?(params[:password])

          flash[:error] = 'Invalid password'
        end

        private

        def load_visualization
          @visualization = load_visualization_from_id(params[:visualization_id])
        end

        def ensure_viewable
          return(render 'admin/visualizations/embed_map_error') if @visualization.private?
          return(render 'show_protected') if @visualization.password_protected?
        end
      end
    end
  end
end

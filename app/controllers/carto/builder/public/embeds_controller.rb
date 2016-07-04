require_dependency 'carto/api/vizjson3_presenter'

module Carto
  module Builder
    module Public
      class EmbedsController < BuilderController
        include VisualizationsControllerHelper

        ssl_required :show, :show_protected

        before_filter :load_visualization, only: [:show, :show_protected]
        before_filter :load_latest_mapcap, :load_vizjson, :load_state, only: [:show, :show_protected]
        before_filter :ensure_viewable, only: [:show]

        skip_before_filter :builder_users_only # This is supposed to be public even in beta

        layout false

        def show
          @visualization_data = Carto::Api::VisualizationPresenter.new(@visualization, current_viewer, self).to_poro

          render 'show'
        end

        def show_protected
          show and return if @visualization.password_valid?(params[:password])

          flash[:error] = 'Invalid password'
          response.status = 403
        end

        private

        def load_visualization
          @visualization = load_visualization_from_id_or_name(params[:visualization_id])
          render_404 unless @visualization
        end

        def load_latest_mapcap
          @latest_mapcap = @visualization.latest_mapcap
        end

        def load_vizjson
          visualization_for_vizjson = @latest_mapcap ? @latest_mapcap.regenerate_visualization : @visualization

          @vizjson = generate_named_map_vizjson3(visualization_for_vizjson, params)
        end

        def load_state
          @state_json = @latest_mapcap ? @latest_mapcap.state_json : {}
        end

        def ensure_viewable
          return(render 'admin/visualizations/embed_map_error', status: 403) if @visualization.private?
          return(render 'show_protected', status: 403) if @visualization.password_protected?
        end
      end
    end
  end
end

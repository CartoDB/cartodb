require_dependency 'carto/api/vizjson3_presenter'

module Carto
  module Builder
    module Public
      class EmbedsController < BuilderController
        include VisualizationsControllerHelper

        ssl_required :show, :show_protected

        before_filter :load_visualization, only: [:show, :show_protected]
        before_filter :load_vizjson, only: [:show, :show_protected]
        before_filter :ensure_viewable, only: [:show]

        skip_before_filter :builder_users_only # This is supposed to be public even in beta

        layout false

        def show
          render 'show', layout: 'application_public_visualization_layout'
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

        def load_vizjson
          visualization_for_vizjson = if @visualization.mapcapped?
                                        @visualization.latest_mapcap.regenerate_visualization
                                      else
                                        @visualization
                                      end

          @vizjson = generate_named_map_vizjson3(visualization_for_vizjson, params)
        end

        def ensure_viewable
          if @visualization.password_protected?
            return(render 'show_protected', status: 403)
          elsif !@visualization.is_viewable_by_user?(current_viewer)
            return(render 'admin/visualizations/embed_map_error', status: 403)
          end
        end
      end
    end
  end
end

require_dependency 'carto/api/vizjson3_presenter'
require_dependency 'carto/helpers/frame_options_helper'

module Carto
  module Builder
    module Public
      class EmbedsController < BuilderController
        include VisualizationsControllerHelper
        include Carto::FrameOptionsHelper

        ssl_required :show, :show_protected

        before_filter :x_frame_options_allow,
                      :load_visualization,
                      :redirect_to_old_embed_if_v2, only: [:show, :show_protected]
        before_filter :load_vizjson,
                      :load_state, only: [:show, :show_protected]
        before_filter :ensure_viewable, only: [:show]
        before_filter :ensure_protected_viewable,
                      :load_auth_tokens,
                      :load_google_maps_qs, only: [:show, :show_protected]

        skip_before_filter :builder_users_only # This is supposed to be public even in beta
        skip_before_filter :verify_authenticity_token, only: [:show_protected]

        layout false

        def show
          process_request_based_on_user_state(@visualization.owner, request)
          @layers_data = visualization_for_presentation.layers.map do |l|
            Carto::Api::LayerPresenter.new(l).to_embed_poro
          end

          render 'show', layout: 'application_public_visualization_layout'
        end

        def show_protected
          process_request_based_on_user_state(@visualization.owner, request)
          if @visualization.password_valid?(params[:password])
            show
          else
            flash[:error] = 'Invalid password'
            response.status = :forbidden
          end
        end

        private

        def load_visualization
          @visualization = load_visualization_from_id_or_name(params[:visualization_id])

          render_embed_error(status: :not_found) unless @visualization
        end

        def load_auth_tokens
          @auth_tokens = if @visualization.password_protected?
                           @visualization.get_auth_tokens
                         elsif @visualization.is_privacy_private?
                           current_viewer ? current_viewer.get_auth_tokens : []
                         else
                           []
                         end
        end

        def load_google_maps_qs
          @google_maps_qs = @visualization.user.google_maps_query_string
        end

        def load_vizjson
          vis = visualization_for_presentation
          @vizjson = generate_named_map_vizjson3(vis, vizjson3_options(vis, params))
        end

        def load_state
          @state = visualization_for_presentation.state.json
        end

        def ensure_viewable
          if @visualization.password_protected?
            if @visualization.published?
              render 'show_protected', status: :forbidden
            else
              render_embed_error(status: :not_found)
            end
          elsif !@visualization.is_viewable_by_user?(current_viewer)
            if @visualization.published?
              render_embed_error(status: :forbidden)
            else
              render_embed_error(status: :not_found)
            end
          end
        end

        def render_embed_error(status:)
          render('admin/visualizations/embed_map_error', status: status)
        end

        def ensure_protected_viewable
          unless @visualization.published? || @visualization.has_read_permission?(current_viewer)
            render_404
          end
        end

        def visualization_for_presentation
          @visualization_for_presentation ||= @visualization.for_presentation
        end

        def redirect_to_old_embed_if_v2
          if @visualization.version != 3
            redirect_to CartoDB.url(self, 'public_visualizations_embed_map', id: @visualization.id)
          end
        end

        def process_request_based_on_user_state(user, request)
          http_code, url = Carto::UserStateManager.manage_request(user, request)
          render_404 if http_code == 404
        end
      end
    end
  end
end

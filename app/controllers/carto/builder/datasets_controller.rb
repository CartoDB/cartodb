require 'carto/api/vizjson3_presenter'

require_dependency 'carto/tracking/events'

module Carto
  module Builder
    class DatasetsController < BuilderController
      include VisualizationsControllerHelper

      ssl_required :show

      before_filter :redirect_to_editor_if_forced, only: :show
      before_filter :load_canonical_visualization, only: :show
      before_filter :authorized_only
      before_filter :load_user_table,
                    :load_auth_tokens, only: :show
      before_filter :editable_visualizations_only, only: :show

      after_filter :update_user_last_activity, only: :show
      after_filter :track_dataset_visit, only: :show

      layout 'application_builder'

      def show
        @canonical_visualization_data = Carto::Api::VisualizationPresenter.new(
          @canonical_visualization, current_viewer, self).to_poro
        @user_table_data = Carto::Api::UserTablePresenter.new(
          @user_table, current_viewer
        ).to_poro(accessible_dependent_derived_maps: true, context: self)
        @layers_data = @canonical_visualization.layers.map do |l|
          Carto::Api::LayerPresenter.new(l, with_style_properties: true).to_poro(migrate_builder_infowindows: true)
        end

        @google_maps_query_string = @canonical_visualization.user.google_maps_query_string

        carto_viewer = current_viewer && Carto::User.where(id: current_viewer.id).first
        @dashboard_notifications = carto_viewer ? carto_viewer.notifications_for_category(:dashboard) : {}
      end

      private

      def redirect_to_editor_if_forced
        unless current_user.builder_enabled?
          redirect_to CartoDB.url(self, 'public_tables_show', params: { id: params[:id] }, user: current_user)
        end
      end

      def load_canonical_visualization
        @canonical_visualization = load_visualization_from_id_or_name(params[:id])
        render_404 unless @canonical_visualization && @canonical_visualization.canonical?
      end

      def authorized_only
        unauthorized unless current_user && @canonical_visualization.has_read_permission?(current_user)
      end

      def load_user_table
        @user_table = @canonical_visualization.user_table
        render_404 unless @user_table
      end

      def load_auth_tokens
        @auth_tokens = current_viewer.get_auth_tokens
      end

      def editable_visualizations_only
        render_404 unless @canonical_visualization.editable?
      end

      def unauthorized
        redirect_to CartoDB.url(self, 'public_table_map', params: { id: request.params[:id] })
      end

      def track_dataset_visit
        current_viewer_id = current_viewer.id
        Carto::Tracking::Events::VisitedPrivatePage.new(current_viewer_id,
                                                        user_id: current_viewer_id,
                                                        page: 'dataset').report
      end
    end
  end
end

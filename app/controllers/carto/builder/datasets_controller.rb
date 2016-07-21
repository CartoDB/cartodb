# encoding: utf-8

require 'carto/api/vizjson3_presenter'

require_dependency 'carto/tracking/events'

module Carto
  module Builder
    class DatasetsController < BuilderController
      include VisualizationsControllerHelper

      ssl_required :show

      before_filter :redirect_to_editor_if_forced, only: :show
      before_filter :load_canonical_visualization, only: :show
      before_filter :authors_only
      before_filter :load_user_table, only: :show
      before_filter :editable_visualizations_only, only: :show

      after_filter :update_user_last_activity, only: :show
      after_filter :track_dataset_visit, only: :show

      layout 'application_builder'

      def show
        @canonical_visualization_data = Carto::Api::VisualizationPresenter.new(
          @canonical_visualization, current_viewer, self).to_poro
        @user_table_data = Carto::Api::UserTablePresenter.new(
          @user_table, @canonical_visualization.permission, current_viewer).to_poro
        @layers_data = @canonical_visualization.layers.map do |l|
          Carto::Api::LayerPresenter.new(l, with_style_properties: true).to_poro(migrate_builder_infowindows: true)
        end
      end

      private

      def redirect_to_editor_if_forced
        redirect_to CartoDB.url(self, 'public_tables_show', id: params[:id]) if current_user.force_editor?
      end

      def load_canonical_visualization
        @canonical_visualization = load_visualization_from_id_or_name(params[:id])
        render_404 unless @canonical_visualization && @canonical_visualization.canonical?
      end

      def authors_only
        unauthorized unless current_user && @canonical_visualization.is_writable_by_user(current_user)
      end

      def load_user_table
        @user_table = @canonical_visualization.user_table
        render_404 unless @user_table
      end

      def editable_visualizations_only
        render_404 unless @canonical_visualization.editable?
      end

      def unauthorized
        redirect_to CartoDB.url(self, 'public_table_map', id: request.params[:id])
      end

      def track_dataset_visit
        Carto::Tracking::Events::VisitedPrivateDataset.new(current_user).report
      end
    end
  end
end

# encoding: utf-8

require 'carto/api/vizjson3_presenter'
require 'carto/api/layer_presenter'

require_dependency 'carto/tracking/events'

module Carto
  module Builder
    class VisualizationsController < BuilderController
      include VisualizationsControllerHelper

      ssl_required :show

      before_filter :redirect_to_editor_if_forced,
                    :load_derived_visualization, only: :show
      before_filter :authors_only
      before_filter :editable_visualizations_only, only: :show

      # TODO: remove this when analysis logic lives in the backend
      before_filter :ensure_source_analyses, unless: :has_analyses?

      after_filter :update_user_last_activity,
                   :track_builder_visit, only: :show

      layout 'application_builder'

      def show
        @visualization_data = Carto::Api::VisualizationPresenter.new(@visualization, current_viewer, self).to_poro
        @layers_data = @visualization.layers.map do |l|
          Carto::Api::LayerPresenter.new(l, with_style_properties: true).to_poro(migrate_builder_infowindows: true)
        end
        @vizjson = generate_anonymous_map_vizjson3(@visualization, params)
        @analyses_data = @visualization.analyses.map { |a| Carto::Api::AnalysisPresenter.new(a).to_poro }
        @basemaps = Cartodb.config[:basemaps].present? && Cartodb.config[:basemaps]
      end

      private

      def redirect_to_editor_if_forced
        redirect_to CartoDB.url(self, 'public_visualizations_show_map', id: params[:id]) if current_user.force_editor?
      end

      def load_derived_visualization
        @visualization = load_visualization_from_id_or_name(params[:id])
        render_404 unless @visualization && @visualization.derived?
      end

      def authors_only
        unauthorized unless !current_user.nil? && @visualization.is_writable_by_user(current_user)
      end

      def editable_visualizations_only
        render_404 unless @visualization.editable?
      end

      def has_analyses?
        @visualization.analyses.any?
      end

      def ensure_source_analyses
        @visualization.add_source_analyses
        @visualization.reload
      end

      def unauthorized
        redirect_to CartoDB.url(self, 'builder_visualization_public_embed', visualization_id: request.params[:id])
      end

      def track_builder_visit
        Carto::Tracking::Events::VisitedPrivateBuilder.new(current_user).report
      end
    end
  end
end

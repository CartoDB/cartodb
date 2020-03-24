require 'carto/api/vizjson3_presenter'
require 'carto/api/layer_presenter'

require_dependency 'carto/tracking/events'
require_dependency 'carto/visualization_migrator'
require_dependency 'carto/helpers/frame_options_helper'

module Carto
  module Builder
    class VisualizationsController < BuilderController
      include VisualizationsControllerHelper
      include Carto::VisualizationMigrator
      include Carto::FrameOptionsHelper

      ssl_required :show

      before_action :load_derived_visualization,
                    :redirect_to_editor_if_forced,
                    :auto_migrate_visualization_if_possible, only: :show
      before_action :authors_only
      before_action :editable_visualizations_only, :load_carto_viewer, only: :show
      before_action :x_frame_options_allow, only: :show, :if => :embedable?

      # TODO: remove this when analysis logic lives in the backend
      before_action :ensure_source_analyses, unless: :has_analyses?

      after_action :update_user_last_activity,
                   :track_builder_visit, only: :show

      layout 'application_builder'

      def show
        @visualization_data = Carto::Api::VisualizationPresenter.new(@visualization, current_viewer, self).to_poro
        @layers_data = @visualization.layers.map do |l|
          Carto::Api::LayerPresenter.new(l, with_style_properties: true).to_poro(migrate_builder_infowindows: true)
        end
        @vizjson = generate_anonymous_map_vizjson3(@visualization)
        @state = @visualization.state.json
        @analyses_data = @visualization.analyses.map { |a| Carto::Api::AnalysisPresenter.new(a).to_poro }
        @basemaps = current_viewer.basemaps
        @overlays_data = @visualization.overlays.map do |overlay|
          Carto::Api::OverlayPresenter.new(overlay).to_poro
        end
        latest_mapcap = @visualization.latest_mapcap
        @mapcaps_data = latest_mapcap ? [Carto::Api::MapcapPresenter.new(latest_mapcap).to_poro] : []
        @google_maps_query_string = @visualization.user.google_maps_query_string

        @builder_notifications = notifications(:builder)
        @dashboard_notifications = notifications(:dashboard)
      end

      private

      def embedable?
        @visualization && @visualization.user.has_feature_flag?('allow_private_viz_iframe')
      end

      def load_carto_viewer
        @carto_viewer = current_viewer && Carto::User.where(id: current_viewer.id).first
      end

      def notifications(category)
        @carto_viewer ? @carto_viewer.notifications_for_category(category) : {}
      end

      def redirect_to_editor_if_forced
        if !current_user.builder_enabled? || @visualization.open_in_editor?
          redirect_to CartoDB.url(self, 'public_visualizations_show_map', params: { id: params[:id] },
                                                                          user: current_user)
        end
      end

      def load_derived_visualization
        @visualization = load_visualization_from_id_or_name(params[:id])
        render_404 unless @visualization && @visualization.derived?
      end

      def authors_only
        unauthorized unless !current_user.nil? && @visualization.writable_by?(current_user)
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
        redirect_to CartoDB.url(self, 'builder_visualization_public_embed',
                                params: { visualization_id: request.params[:id] })
      end

      def track_builder_visit
        current_viewer_id = current_viewer.id
        Carto::Tracking::Events::VisitedPrivatePage.new(current_viewer_id,
                                                        user_id: current_viewer_id,
                                                        page: 'builder').report
      end

      def auto_migrate_visualization_if_possible
        if version_needs_migration?(@visualization.version, 3) && @visualization.can_be_automatically_migrated_to_v3?
          @visualization.version = 3
          @visualization.save
          migrate_visualization_to_v3(@visualization)
        end
      end
    end
  end
end

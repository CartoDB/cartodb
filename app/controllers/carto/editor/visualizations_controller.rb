# encoding: utf-8

require 'carto/api/vizjson3_presenter'
require 'carto/api/layer_presenter'

module Carto
  module Editor
    class VisualizationsController < EditorController
      include VisualizationsControllerHelper

      ssl_required :show

      before_filter :load_visualization, only: [:show]
      before_filter :authors_only
      before_filter :editable_visualizations_only, only: [:show]

      after_filter :update_user_last_activity, only: [:show]

      layout 'application_editor3'

      def show
        @visualization_data = Carto::Api::VisualizationPresenter.new(@visualization, current_viewer, self).to_poro
        @layers_data = @visualization.layers.map { |l| Carto::Api::LayerPresenter.new(l).to_poro }
        @vizjson = generate_vizjson3(@visualization, params)
        @analyses_data = @visualization.analyses.map { |a| Carto::Api::AnalysisPresenter.new(a).to_poro }
      end

      private

      def load_visualization
        @visualization = load_visualization_from_id(params[:id])
      end

      def authors_only
        render_403 unless !current_user.nil? && @visualization.is_writable_by_user(current_user)
      end

      def editable_visualizations_only
        render_403 unless @visualization.editable?
      end
    end
  end
end

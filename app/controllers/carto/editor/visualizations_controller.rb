require 'carto/api/vizjson3_presenter'

module Carto
  module Editor
    class VisualizationsController < EditorController
      include VisualizationsControllerHelper

      ssl_required :show

      before_filter :load_visualization, only: [:show]

      after_filter :update_user_last_activity, only: [:show]

      layout 'application_editor3'

      def show
        @visualization_data = Carto::Api::VisualizationPresenter.new(@visualization, current_viewer, self).to_poro
        @vizjson = Carto::Api::VizJSON3Presenter.new(@visualization, $tables_metadata)
                                               .to_vizjson(https_request: is_https?)
      end

      private

      def load_visualization
        @visualization = get_priority_visualization(params[:id], current_user.id)

        render_404 && return if @visualization.nil?
        render_403 && return unless allowed?(@visualization)
      end

      def allowed?(visualization)
        !(visualization.type_slide? || visualization.kind_raster? || !visualization.is_writable_by_user(current_user))
      end
    end
  end
end

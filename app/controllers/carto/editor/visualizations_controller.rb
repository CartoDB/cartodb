module Carto
  module Editor
    class VisualizationsController < EditorController
      include VisualizationsControllerHelper

      ssl_required :show

      before_filter :load_visualization, only: [:show]

      after_filter :update_user_last_activity, only: [:show]

      def show
        @vizjson = Carto::Api::VizJSONPresenter.new(@visualization, $tables_metadata)
                                               .to_vizjson(https_request: is_https?)
      end

      private

      def load_visualization
        @visualization = get_priority_visualization(params[:id], current_user.id)

        render_404 unless allowed?(@visualization)
        render_403 unless @visualization.is_writable_by_user?(current_user)
      end

      def allowed?(visualization)
        true unless visualization.nil? || visualization.type_slide? || visualization.kind_raster?
      end
    end
  end
end

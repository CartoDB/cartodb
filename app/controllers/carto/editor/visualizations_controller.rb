module Carto
  module Editor
    class VisualizationsController < EditorController
      include VisualizationsControllerHelper

      ssl_required :show

      before_filter :load_visualization, only: [:show]

      after_filter :update_user_last_activity, only: [:show]

      def show
      end

      private

      def load_visualization
        @visualization = get_priority_visualization(params[:id], current_user.id)

        render_404 unless allowed?(@visualization)
      end

      def update_user_last_activity
        return false unless current_user.present?
        current_user.set_last_active_time
        current_user.set_last_ip_address request.remote_ip
      end

      def allowed?(visualization)
        true unless visualization.nil? || visualization.type_slide? || visualization.kind_raster?
      end
    end
  end
end

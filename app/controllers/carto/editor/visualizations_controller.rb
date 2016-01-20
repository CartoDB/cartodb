module Carto
  module Editor
    class VisualizationsController < EditorController
      ssl_required :show

      before_filter :load_visualization_and_table, only: [:show]

      after_filter :update_user_last_activity, only: [:show]

      def show
      end

      private

      def load_visualization_and_table
        visualization = Carto::VisualizationQueryBuilder.new
                                                        .with_id_or_name(params[:id])
                                                        .with_user_id(current_user.id)
                                                        .build
                                                        .all
                                                        .sort do |vis_a, _vis_b|
                                                          vis_a.type == Carto::Visualization::TYPE_CANONICAL ? -1 : 1
                                                        end
                                                        .first


        @visualization = Carto::Admin::VisualizationPublicMapAdapter.new(visualization, current_user, self)
        @table = visualization.table_service

        render_pretty_404 if disallowed?(@visualization)
      end

      def update_user_last_activity
        return false unless current_user.present?
        current_user.set_last_active_time
        current_user.set_last_ip_address request.remote_ip
      end

      def disallowed?(visualization)
        visualization.nil? || visualization.type_slide? || visualization.kind_raster?
      end

      def render_pretty_404
        render(file: "public/404.html", layout: false, status: 404)
      end
    end
  end
end

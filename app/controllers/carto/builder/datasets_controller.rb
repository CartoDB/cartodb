# encoding: utf-8

require 'carto/api/vizjson3_presenter'

module Carto
  module Builder
    class DatasetsController < BuilderController
      include VisualizationsControllerHelper

      ssl_required :show

      before_filter :redirect_to_editor_if_forced, only: [:show]
      before_filter :load_canonical_visualization, only: [:show]
      before_filter :authors_only
      before_filter :load_user_table, only: [:show]

      after_filter :update_user_last_activity, only: [:show]

      layout 'application_builder'

      def show
        @canonical_visualization_data = Carto::Api::VisualizationPresenter.new(
          @canonical_visualization, current_viewer, self).to_poro
        @user_table_data = Carto::Api::UserTablePresenter.new(
          @user_table, @canonical_visualization.permission, current_viewer).to_poro
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
        render_403 unless !current_user.nil? && @canonical_visualization.is_writable_by_user(current_user)
      end

      def load_user_table
        @user_table = @canonical_visualization.user_table
        render_404 unless @user_table
      end
    end
  end
end

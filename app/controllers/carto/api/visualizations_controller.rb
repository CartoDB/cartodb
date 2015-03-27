require_relative 'visualization_presenter'

module Carto

  module Api

    class VisualizationsController < ::Api::ApplicationController

      def index
        vqb = VisualizationQueryBuilder.new.with_user_id(current_user.id)
        visualizations = vqb.build.all
        response = {
          visualizations: visualizations.map { |v| VisualizationPresenter.new(v).to_poro },
          total_entries: visualizations.count,
          total_user_entries: visualizations.count,
          total_likes: 0,
          total_shared: 0
        }
        render_jsonp(response)
      end

      private

      def representation(visualization)
      end

    end

  end

end

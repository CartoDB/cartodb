require_relative 'visualization_presenter'

module Carto

  module Api

    class VisualizationsController < ::Api::ApplicationController

      def index
        types = params.fetch(:types, '').split(',')
        type = params[:type].present? ? params[:type] : default_type(types)
        page = (params[:page] || 1).to_i
        per_page = (params[:per_page] || 20).to_i
        only_liked = params[:only_liked] == 'true'
        locked = params[:locked]

        vqb = VisualizationQueryBuilder.new
            .with_prefetch_user
            .with_prefetch_table
            .with_prefetch_permission
            .with_prefetch_external_source
            .with_locked(locked)
            .with_type(type)

        if locked == 'true'
          vqb.with_locked(true)
        elsif locked == 'false'
          vqb.with_locked(false)
        end

        if only_liked
          vqb.with_liked_by_user_id(current_user.id)
        else
          vqb.with_user_id(current_user.id)
        end

        # TODO:
        # - total_shared
        response = {
          visualizations: vqb.build_paged(page, per_page).map { |v| VisualizationPresenter.new(v, current_viewer).to_poro },
          total_entries: vqb.build.count,
          total_user_entries: VisualizationQueryBuilder.new.with_type(type).with_user_id(current_user.id).build.count,
          total_likes: VisualizationQueryBuilder.new.with_liked_by_user_id(current_user.id).build.count,
          total_shared: 0
        }
        render_jsonp(response)
      end

      private

      def default_type(types)
        types.include?(Carto::Visualization::TYPE_DERIVED) ? Carto::Visualization::TYPE_DERIVED : Carto::Visualization::TYPE_CANONICAL
      end
    end

  end

end

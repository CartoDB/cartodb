require_relative 'visualization_presenter'

module Carto

  module Api

    class VisualizationsController < ::Api::ApplicationController

      before_filter :table_and_schema_from_params
      before_filter :load_visualization, only: [:likes_count, :likes_list, :is_liked]

      FILTER_SHARED_YES = 'yes'
      FILTER_SHARED_NO = 'no'
      FILTER_SHARED_ONLY = 'only'

      def table_and_schema_from_params
        if params.fetch('id', nil) =~ /\./
          @table_id, @schema = params.fetch('id').split('.').reverse
        else
          @table_id, @schema = [params.fetch('id', nil), nil]
        end
      end

      def load_visualization
        @visualization = Visualization.find(@table_id)
        return render(text: exception.message, status: 403) if !@visualization.is_viewable_by?(current_viewer)
      end

      def index
        types = params.fetch(:types, '').split(',')
        type = params[:type].present? ? params[:type] : default_type(types)
        page = (params[:page] || 1).to_i
        per_page = (params[:per_page] || 20).to_i
        only_liked = params[:only_liked] == 'true'
        order = (params[:order] || 'updated_at').to_sym

        only_shared = params[:only_shared] == 'true'
        exclude_shared = params[:exclude_shared] == 'true'
        shared = params[:shared] || compose_shared(only_shared, exclude_shared)
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
        end

        case shared
        when FILTER_SHARED_YES
          vqb.with_owned_by_or_shared_with_user_id(current_user.id)
        when FILTER_SHARED_NO
          vqb.with_user_id(current_user.id)
        when FILTER_SHARED_ONLY
          vqb.with_shared_with_user_id(current_user.id)
        end

        # TODO: undesirable table hardcoding, needed for disambiguation. Look for
        # a better approach and/or move it to the query builder
        response = {
          visualizations: vqb.with_order("visualizations.#{order}", :desc).build_paged(page, per_page).map { |v| VisualizationPresenter.new(v, current_viewer).to_poro },
          total_entries: vqb.build.count,
          total_user_entries: VisualizationQueryBuilder.new.with_type(type).with_user_id(current_user.id).build.count,
          total_likes: VisualizationQueryBuilder.new.with_type(type).with_liked_by_user_id(current_user.id).build.count,
          total_shared: VisualizationQueryBuilder.new.with_type(type).with_shared_with_user_id(current_user.id).build.count
        }
        render_jsonp(response)
      end

      def likes_count
        render_jsonp({
          id: @visualization.id,
          likes: @visualization.likes.count
        })
      end

      def likes_list
        render_jsonp({
          id: @visualization.id,
          likes: @visualization.likes.map { |like| { actor_id: like.actor } }
        })
      end

      def is_liked
        render_jsonp({
          id: @visualization.id,
          likes: @visualization.likes.count,
          liked: @visualization.liked_by?(current_viewer.id)
        })
      end

      private

      def default_type(types)
        types.include?(Carto::Visualization::TYPE_DERIVED) ? Carto::Visualization::TYPE_DERIVED : Carto::Visualization::TYPE_CANONICAL
      end

      def compose_shared(only_shared, exclude_shared)
        if only_shared
          FILTER_SHARED_ONLY
        elsif exclude_shared
          FILTER_SHARED_NO
        elsif exclude_shared == false
          FILTER_SHARED_YES
        else
          # INFO: exclude_shared == nil && !only_shared
          nil
        end
      end

    end

  end

end

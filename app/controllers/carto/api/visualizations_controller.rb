require_relative 'visualization_presenter'

module Carto

  module Api

    class VisualizationsController < ::Api::ApplicationController

      before_filter :table_and_schema_from_params
      before_filter :load_visualization, only: [:likes_count, :likes_list, :is_liked]

      skip_before_filter :api_authorization_required, only: [:index]
      before_filter :optional_api_authorization, only: [:index]

      FILTER_SHARED_YES = 'yes'
      FILTER_SHARED_NO = 'no'
      FILTER_SHARED_ONLY = 'only'

      def optional_api_authorization
        if params[:api_key].present?
          authenticate(:api_key, :api_authentication, :scope => CartoDB.extract_subdomain(request))
        end
      end

      def table_and_schema_from_params
        if params.fetch('id', nil) =~ /\./
          @table_id, @schema = params.fetch('id').split('.').reverse
        else
          @table_id, @schema = [params.fetch('id', nil), nil]
        end
      end

      def load_visualization
        @visualization = Visualization.find(@table_id)
        return render(text: 'Visualization not viewable', status: 403) if !@visualization.is_viewable_by_user?(current_viewer)
      end

      def index
        type = params[:type].present? && type != '' ? params[:type] : Carto::Visualization::TYPE_CANONICAL
        types = params.fetch(:types, type).split(',')
        page = (params[:page] || 1).to_i
        per_page = (params[:per_page] || 20).to_i
        order = (params[:order] || 'updated_at').to_sym
        pattern = params[:q]

        only_liked = params[:only_liked] == 'true'
        only_shared = params[:only_shared] == 'true'
        exclude_shared = params[:exclude_shared] == 'true'
        locked = params[:locked]
        shared = compose_shared(params[:shared], only_shared, exclude_shared)

        vqb = VisualizationQueryBuilder.new
            .with_prefetch_user
            .with_prefetch_table
            .with_prefetch_permission
            .with_prefetch_external_source
            .with_types(types)

        if current_user
          if only_liked
            vqb.with_liked_by_user_id(current_user.id)
          end

          case shared
          when FILTER_SHARED_YES
            vqb.with_owned_by_or_shared_with_user_id(current_user.id)
          when FILTER_SHARED_NO
            vqb.with_user_id(current_user.id) if !only_liked
          when FILTER_SHARED_ONLY
            vqb.with_shared_with_user_id(current_user.id)
          end

          if locked == 'true'
            vqb.with_locked(true)
          elsif locked == 'false'
            vqb.with_locked(false)
          end
        else
          # TODO: ok, this looks like business logic, refactor
          subdomain = CartoDB.extract_subdomain(request)
          vqb.with_user_id(Carto::User.where(username: subdomain).first.id)
              .with_privacy(Carto::Visualization::PRIVACY_PUBLIC)
        end

        if pattern.present?
          vqb.with_partial_match(pattern)
        end

        # TODO: undesirable table hardcoding, needed for disambiguation. Look for
        # a better approach and/or move it to the query builder
        response = {
          visualizations: vqb.with_order("visualizations.#{order}", :desc).build_paged(page, per_page).map { |v| VisualizationPresenter.new(v, current_viewer).to_poro },
          total_entries: vqb.build.count
        }
        if current_user
          response.merge!({
            total_user_entries: VisualizationQueryBuilder.new.with_types(types).with_user_id(current_user.id).build.count,
            total_likes: VisualizationQueryBuilder.new.with_types(types).with_liked_by_user_id(current_user.id).build.count,
            total_shared: VisualizationQueryBuilder.new.with_types(types).with_shared_with_user_id(current_user.id).build.count
          })
        end
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
          liked: @visualization.is_liked_by_user_id?(current_viewer.id)
        })
      end

      private

      def compose_shared(shared, only_shared, exclude_shared)
        valid_shared = shared if [FILTER_SHARED_ONLY, FILTER_SHARED_NO, FILTER_SHARED_YES].include?(shared)
        return valid_shared if valid_shared

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

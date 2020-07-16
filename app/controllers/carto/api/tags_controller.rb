require_dependency 'carto/controller_helper'

module Carto
  module Api
    class TagsController < ::Api::ApplicationController
      include PagedSearcher

      ssl_required

      before_filter :load_parameters

      rescue_from StandardError, with: :rescue_from_standard_error
      rescue_from Carto::ParamCombinationInvalidError, with: :rescue_from_carto_error

      DEFAULT_TAGS_PER_PAGE = 6

      def index
        query_builder = tag_query_builder
        result = query_builder.build_paged(@page, @per_page)
        total_count = query_builder.total_count

        render json: format_response(result, total_count)
      end

      private

      def tag_query_builder
        query_builder = Carto::TagQueryBuilder.new
                                              .with_types(@types)
                                              .with_partial_match(@pattern)

        return query_builder.with_owned_by_or_shared_with_user_id(current_viewer.id) if @include_shared
        query_builder.with_owned_by_user_id(current_viewer.id)
      end

      def load_parameters
        @page, @per_page = page_per_page_params(default_per_page: DEFAULT_TAGS_PER_PAGE)

        @pattern = params[:q]
        @include_shared = params[:include_shared] == 'true'

        @types = params.fetch(:types, "").split(',')
        if (@types - Carto::Visualization::VALID_TYPES).present?
          raise Carto::ParamCombinationInvalidError.new(:types, Carto::Visualization::VALID_TYPES)
        end
      end

      def format_response(result, total_count)
        paged_result(
          result: result,
          total_count: total_count,
          page: @page,
          per_page: @per_page,
          params: params
        ) { |params| api_v3_users_tags_url(params) }
      end

    end
  end
end

require_dependency 'carto/controller_helper'

module Carto
  module Api
    class TagsController < ::Api::ApplicationController
      include Carto::ControllerHelper
      include PagedSearcher

      ssl_required

      rescue_from StandardError, with: :rescue_from_standard_error

      DEFAULT_TAGS_PER_PAGE = 6

      def index
        page, per_page = page_per_page_params(default_per_page: DEFAULT_TAGS_PER_PAGE)

        query_builder = Carto::TagQueryBuilder.new(current_viewer.id)
        result = query_builder.build_paged(page, per_page)
        total_count = query_builder.total_count

        formatted_response = paged_result(
          result: result,
          total_count: total_count,
          page: page,
          per_page: per_page,
          order: nil
        ) { |params| api_v3_users_tags_url(params) }

        render json: formatted_response
      end

    end
  end
end

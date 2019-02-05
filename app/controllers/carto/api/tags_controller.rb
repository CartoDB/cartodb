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

        render json: result
      end

    end
  end
end

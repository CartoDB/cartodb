require_dependency 'carto/controller_helper'

module Carto
  module Api
    class TagsController < ::Api::ApplicationController
      include Carto::ControllerHelper
      include PagedSearcher

      ssl_required

      before_filter :load_parameters

      rescue_from StandardError, with: :rescue_from_standard_error

      DEFAULT_TAGS_PER_PAGE = 6
      VALID_TYPES = %w(table derived remote).freeze

      def index
        query_builder = Carto::TagQueryBuilder.new(current_viewer.id)
                                              .with_types(@types)
        result = query_builder.build_paged(@page, @per_page)
        total_count = query_builder.total_count

        render json: format_response(result, total_count)
      rescue Carto::ParamCombinationInvalidError => e
        render_jsonp({ error: e.message }, e.status)
      end

      private

      def load_parameters
        @page, @per_page = page_per_page_params(default_per_page: DEFAULT_TAGS_PER_PAGE)

        @types = params.fetch(:types, "").split(',')
        if (@types - VALID_TYPES).present?
          raise Carto::ParamCombinationInvalidError.new(:types, VALID_TYPES)
        end
      end

      def format_response(result, total_count)
        paged_result(
          result: result,
          total_count: total_count,
          params: params
        ) { |params| api_v3_users_tags_url(params) }
      end

    end
  end
end

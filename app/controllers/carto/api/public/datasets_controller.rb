require_relative '../paged_searcher'
require_dependency 'carto/oauth_provider/errors'

module Carto
  module Api
    module Public
      class DatasetsController < Carto::Api::Public::ApplicationController
        include Carto::Api::PagedSearcher
        include Carto::ControllerHelper
        extend Carto::DefaultRescueFroms

        ssl_required

        before_action :load_user
        before_action :load_params
        before_action :check_permissions
        before_action :engine_required

        setup_default_rescues
        rescue_from Carto::OauthProvider::Errors::ServerError, with: :rescue_oauth_errors

        VALID_ORDER_PARAMS = [:name].freeze

        def index
          result = @user.in_database[select_user_tables_query].all
          total = @user.in_database[count_user_tables_query].first[:count]

          render_paged(result, total)
        end

        private

        def load_user
          @user = ::User.where(id: current_viewer.id).first
        end

        def load_params
          @page, @per_page, @order, @direction = page_per_page_order_params(
            VALID_ORDER_PARAMS, default_order: 'name', default_order_direction: 'asc'
          )
          @offset = (@page - 1) * @per_page
        end

        def check_permissions
          api_key = Carto::ApiKey.find_by_token(params["api_key"])
          raise UnauthorizedError unless api_key.master? || api_key.dataset_metadata_permissions
        end

        def select_user_tables_query
          %{
            SELECT cdb_usertables AS name FROM cartodb.CDB_UserTables()
            ORDER BY #{@order} #{@direction}
            LIMIT #{@per_page}
            OFFSET #{@offset}
          }.squish
        end

        def count_user_tables_query
          'SELECT COUNT(*) FROM cartodb.CDB_UserTables()'
        end

        def render_paged(result, total)
          enriched_response = paged_result(
            result: result,
            total_count: total,
            page: @page,
            per_page: @per_page,
            params: params.except('controller', 'action')
          ) { |params| api_v4_datasets_url(params) }

          render_jsonp(enriched_response, 200)
        end

        def rescue_oauth_errors(exception)
          render json: { errors: exception.parameters[:error_description] }, status: 500
        end
      end
    end
  end
end

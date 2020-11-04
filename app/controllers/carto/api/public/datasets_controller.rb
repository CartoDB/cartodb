require_relative '../paged_searcher'
require_dependency 'carto/oauth_provider/errors'

module Carto
  module Api
    module Public
      class DatasetsController < Carto::Api::Public::ApplicationController
        include Carto::Api::PagedSearcher
        extend Carto::DefaultRescueFroms

        ssl_required

        before_action :load_user
        before_action :load_params
        before_action :check_permissions
        before_action :engine_required

        setup_default_rescues
        rescue_from Carto::OauthProvider::Errors::ServerError, with: :rescue_oauth_errors

        VALID_ORDER_PARAMS = %i(name).freeze

        def index
          db_service = @user.carto_user.db_service

          tables = db_service.tables_granted(@query_params)
          result = enrich_tables(tables)
          total = db_service.tables_granted_count

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
          @query_params = { order: @order, direction: @direction, limit: @per_page, offset: @offset }
        end

        def check_permissions
          api_key = Carto::ApiKey.find_by_token(params["api_key"])
          raise UnauthorizedError unless api_key.master? || api_key.dataset_metadata_permissions
        end

        def enrich_tables(tables)
          table_names = tables.map(&:name)
          visualizations = table_visualizations(table_names)
          tables.map do |table|
            viz = visualizations.find { |visualization| visualization[:name] == table.name }
            extra_fields = viz || default_extra_fields
            table.to_h.merge(extra_fields)
          end
        end

        def default_extra_fields
          {
            cartodbfied: false,
            shared: false,
            privacy: nil,
            updated_at: nil
          }
        end

        def table_visualizations(names)
          visualizations = Carto::VisualizationQueryBuilder.new
                                                           .with_owned_by_or_shared_with_user_id(@user.id)
                                                           .with_name(names)
                                                           .with_type(Carto::Visualization::TYPE_CANONICAL)
                                                           .build.all
          visualizations.map do |visualization|
            {
              name: visualization.name,
              privacy: visualization.privacy,
              cartodbfied: true,
              updated_at: visualization.updated_at,
              shared: !visualization.is_owner?(@user)
            }
          end
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
          log_rescue_from(__method__, exception)

          render json: { errors: exception.parameters[:error_description] }, status: 500
        end
      end
    end
  end
end

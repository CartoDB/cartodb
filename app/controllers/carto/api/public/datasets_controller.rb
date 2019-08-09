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

        VALID_ORDER_PARAMS = %i(name type).freeze

        def index
          tables = @user.in_database[select_tables_query].all
          result = enrich_tables(tables)
          total = @user.in_database[count_tables_query].first[:count]

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
          @types = %w(table view matview)
        end

        def check_permissions
          api_key = Carto::ApiKey.find_by_token(params["api_key"])
          raise UnauthorizedError unless api_key.master? || api_key.dataset_metadata_permissions
        end

        def enrich_tables(tables)
          table_names = tables.map { |table| table[:name] }
          visualizations = table_visualizations(table_names)
          tables.map do |table|
            visualizations.find { |visualization| visualization[:name] == table[:name] } || table
          end
        end

        def table_visualizations(names)
          visualizations = Carto::VisualizationQueryBuilder.new
                                                           .with_user_id(@user.id)
                                                           .with_name(names)
                                                           .with_type(Carto::Visualization::TYPE_CANONICAL)
                                                           .build.all
          visualizations.map do |visualization|
            {
              name: visualization.name,
              cartodbfied: true,
              type: 'table',
              privacy: visualization.privacy
            }
          end
        end

        def select_tables_query
          %{
            SELECT * FROM (#{tables_and_views_query}) AS tables_and_views
            ORDER BY #{@order} #{@direction}
            LIMIT #{@per_page}
            OFFSET #{@offset}
          }.squish
        end

        def count_tables_query
          "SELECT COUNT(*) FROM (#{tables_and_views_query}) AS tables_and_views"
        end

        def tables_and_views_query
          @types.map { |type|
            %{
              SELECT #{type}name AS name, '#{type}' AS type, false AS cartodbfied, NULL AS privacy
              FROM pg_#{type}s
              WHERE schemaname = '#{@user.database_schema}'
              AND #{type}owner <> 'postgres'
            }
          }.join(' UNION ').squish
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

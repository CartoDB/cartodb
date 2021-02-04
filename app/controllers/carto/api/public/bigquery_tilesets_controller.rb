module Carto
  module Api
    module Public
      class BigqueryTilesetsController < Carto::Api::Public::ApplicationController

        include Carto::Api::PagedSearcher
        extend Carto::DefaultRescueFroms

        VALID_ORDER_PARAMS_LIST_TILESET = %i(id).freeze

        before_action :load_user
        before_action :load_service
        before_action :check_permissions

        before_action only: [:list_tilesets] do
          load_pagination_params(default_order: 'id', valid_order_params: VALID_ORDER_PARAMS_LIST_TILESET)
        end

        setup_default_rescues

        def list_datasets
          result = @service.list_datasets
          render_jsonp(result, 200)
        end

        def list_tilesets
          dataset_id = params['dataset_id']
          result = @service.list_tilesets(dataset_id: dataset_id, **@pagination)
          total = @service.count_tilesets(dataset_id)

          enriched_response = paged_result(
            result: result,
            total_count: total,
            page: @pagination[:page],
            per_page: @pagination[:per_page],
            params: params.except('controller', 'action', 'format')
          ) { |params| api_v4_bigquery_list_tilesets_url(params) }

          render_jsonp(enriched_response, 200)
        end

        def tileset
          tileset_id = params['tileset_id']
          result = @service.tileset(tileset_id)
          render_jsonp(result, 200)
        end

        def publish
          dataset_id = params['dataset_id']
          raise Carto::LoadError, 'Missing dataset_id query param' if dataset_id.blank?

          tileset_id = params['tileset_id']
          raise Carto::LoadError, 'Missing tileset_id query param' if tileset_id.blank?

          @service.publish(dataset_id: dataset_id, tileset_id: tileset_id)

          render_jsonp({}, 204)
        end

        def unpublish
          dataset_id = params['dataset_id']
          raise Carto::LoadError, 'Missing dataset_id query param' if dataset_id.blank?

          tileset_id = params['tileset_id']
          raise Carto::LoadError, 'Missing tileset_id query param' if tileset_id.blank?

          @service.unpublish(dataset_id: dataset_id, tileset_id: tileset_id)

          render_jsonp({}, 204)
        end

        private

        def load_user
          @user = Carto::User.where(id: current_viewer.id).first
        end

        def load_service
          connection_id = params['connection_id']
          raise Carto::LoadError, 'Missing connection_id query param' if connection_id.blank?

          project_id = params['project_id']
          raise Carto::LoadError, 'Missing project_id query param' if project_id.blank?

          @service = Carto::BigqueryTilesetsService.new(
            user: @user,
            connection_id: connection_id,
            project_id: project_id
          )
        end

        def check_permissions
          @api_key = Carto::ApiKey.find_by(token: params['api_key'])
          raise UnauthorizedError unless @api_key&.master?
          raise UnauthorizedError unless @api_key.user_id == @user.id
        end

        def load_pagination_params(default_order:, valid_order_params:)
          page, per_page, order, direction = page_per_page_order_params(
            valid_order_params,
            default_order: default_order,
            default_order_direction: 'asc'
          )
          offset = (page - 1) * per_page
          @pagination = { page: page, per_page: per_page, order: order, direction: direction, offset: offset }
        end

      end
    end
  end
end

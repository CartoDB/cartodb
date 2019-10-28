module Carto
  module Api
    module Public
      class FederatedTablesController < Carto::Api::Public::ApplicationController
        include Carto::Api::PagedSearcher
        include Carto::ControllerHelper
        extend Carto::DefaultRescueFroms

        before_action :load_user
        before_action :load_params

        setup_default_rescues

        VALID_ORDER_PARAMS = %i(name).freeze

        def index
          service = Carto::FederatedTablesService.new(
            user: @user,
            page: @page,
            per_page: @per_page,
            order: @order,
            direction: @direction
          )

          result = service.list_servers()
          total = service.count_servers()

          render_paged(result, total)
        end

        private

        def load_user
          @user = ::User.where(id: current_viewer.id).first
        end

        def load_params
          @page, @per_page, @order, @direction = page_per_page_order_params(
            VALID_ORDER_PARAMS, default_order: 'name',
            default_order_direction: 'asc'
          )
        end

        def render_paged(result, total)
          enriched_response = paged_result(
            result: result,
            total_count: total,
            page: @page,
            per_page: @per_page,
            params: params.except('controller', 'action')
          ) { |params| api_v4_federated_servers_list_servers_url(params) }

          render_jsonp(enriched_response, 200)
        end
      end
    end
  end
end

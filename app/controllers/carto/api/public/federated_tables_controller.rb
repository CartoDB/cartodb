module Carto
  module Api
    module Public
      class FederatedTablesController < Carto::Api::Public::ApplicationController
        include Carto::Api::PagedSearcher
        include Carto::ControllerHelper
        extend Carto::DefaultRescueFroms

        before_action :load_user
        before_action :load_params
        before_action :check_permissions

        setup_default_rescues

        VALID_ORDER_PARAMS = %i(name).freeze

        def index
          service = Carto::FederatedTablesService.new(user: @user)

          result = service.list_servers(
            page: @page,
            per_page: @per_page,
            order: @order,
            direction: @direction
          )
          total = service.count_servers()

          render_paged(result, total)
        end

        def register
          service = Carto::FederatedTablesService.new(user: @user)

          federated_server = service.register_server(
            name: params[:name],
            mode: params[:mode],
            dbname: params[:dbname],
            host: params[:host],
            port: params[:port],
            username: params[:username],
            password: params[:password]
          )

          response.headers['Content-Location'] = "#{request.path}/#{federated_server[:name]}"

          render_jsonp({}, 201)
        end

        def show
          service = Carto::FederatedTablesService.new(user: @user)

          federated_server = service.get_server(name: params[:name])
          federated_server[:password] = '********'

          render_jsonp(federated_server, 200)
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

        def check_permissions
          api_key = Carto::ApiKey.find_by_token(params["api_key"])
          raise UnauthorizedError unless api_key.master? || api_key.dataset_metadata_permissions
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

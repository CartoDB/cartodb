module Carto
  module Api
    module Public
      class FederatedTablesController < Carto::Api::Public::ApplicationController
        include Carto::Api::PagedSearcher
        include Carto::ControllerHelper
        extend Carto::DefaultRescueFroms

        before_action :load_user
        before_action :load_service
        before_action only: [:list_federated_servers, :list_remote_schemas] do
          load_params(default_order: 'name')
        end
        before_action only: [:list_remote_tables] do
          load_params(default_order: 'remote_table_name')
        end
        before_action :check_permissions
        before_action :load_federated_server, only: [:update_federated_server, :unregister_federated_server, :show_federated_server ]
        before_action :check_federated_server, only: [:unregister_federated_server, :show_federated_server]

        setup_default_rescues

        VALID_ORDER_PARAMS = %i(name remote_table_name).freeze

        # Federated Servers

        def list_federated_servers
          result = @service.list_servers(
            page: @page,
            per_page: @per_page,
            order: @order,
            direction: @direction
          )
          total = @service.count_servers()

          render_paged(result, total)
        end

        def register_federated_server
          federated_server = @service.register_server(
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

        def show_federated_server
          @federated_server[:password] = '********'
          render_jsonp(@federated_server, 200)
        end

        def update_federated_server
          if @federated_server.empty?
            @federated_server = @service.register_server(
              name: params[:name],
              mode: params[:mode],
              dbname: params[:dbname],
              host: params[:host],
              port: params[:port],
              username: params[:username],
              password: params[:password]
            )

            response.headers['Content-Location'] = "#{request.path}/#{@federated_server[:name]}"

            return render_jsonp({}, 201)
          end

          @federated_server = @service.update_server(
            name: params[:name],
            mode: params[:mode],
            dbname: params[:dbname],
            host: params[:host],
            port: params[:port],
            username: params[:username],
            password: params[:password]
          )

          render_jsonp({}, 204)
        end

        def unregister_federated_server
          @service.unregister_server(name: params[:name])
          render_jsonp({}, 204)
        end

        # Remote Schemas

        def list_remote_schemas
          result = @service.list_remote_schemas(
            server: params[:federated_server_name],
            page: @page,
            per_page: @per_page,
            order: @order,
            direction: @direction
          )
          total = @service.count_remote_schemas(server: params[:federated_server_name])
          render_paged(result, total)
        end

        # Remote Tables

        def list_remote_tables
          result = @service.list_remote_tables(
            server: params[:federated_server_name],
            schema: params[:remote_schema_name],
            page: @page,
            per_page: @per_page,
            order: @order,
            direction: @direction
          )
          total = @service.count_remote_tables(
            server: params[:federated_server_name],
            schema: params[:remote_schema_name]
          )
          render_paged(result, total)
        end

        private

        def load_user
          @user = ::User.where(id: current_viewer.id).first
        end

        def load_service
          @service = Carto::FederatedTablesService.new(user: @user)
        end

        def load_params(default_order:)
          @page, @per_page, @order, @direction = page_per_page_order_params(
            VALID_ORDER_PARAMS,
            default_order: default_order,
            default_order_direction: 'asc'
          )
        end

        def load_federated_server
          @federated_server = @service.get_server(name: params[:federated_server_name])
        end

        def check_federated_server
          raise Carto::LoadError.new("Federated server key not found: #{params[:federated_server_name]}") if @federated_server.empty?
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

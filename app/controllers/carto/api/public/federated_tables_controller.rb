module Carto
  module Api
    module Public
      class FederatedTablesController < Carto::Api::Public::ApplicationController
        include Carto::Api::PagedSearcher
        include Carto::ControllerHelper
        extend Carto::DefaultRescueFroms

        VALID_ORDER_PARAMS_FEDERATED_SERVER = %i(federated_server_name).freeze
        VALID_ORDER_PARAMS_REMOTE_SCHEMA = %i(remote_schema_name).freeze
        VALID_ORDER_PARAMS_REMOTE_TABLE = %i(remote_table_name).freeze

        before_action :load_user
        before_action :load_service
        before_action only: [:list_federated_servers] do
          load_params(default_order: 'federated_server_name', valid_order_params: VALID_ORDER_PARAMS_FEDERATED_SERVER)
        end
        before_action only: [:list_remote_schemas] do
          load_params(default_order: 'remote_schema_name', valid_order_params: VALID_ORDER_PARAMS_REMOTE_SCHEMA)
        end
        before_action only: [:list_remote_tables] do
          load_params(default_order: 'remote_table_name', valid_order_params: VALID_ORDER_PARAMS_REMOTE_TABLE)
        end
        before_action :check_permissions
        before_action :load_federated_server, only: [:update_federated_server, :unregister_federated_server, :show_federated_server]
        before_action :check_federated_server, only: [:unregister_federated_server, :show_federated_server]
        before_action :load_remote_table, only: [:show_remote_table]
        before_action :check_remote_table, only: [:show_remote_table]

        setup_default_rescues

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
            federated_server_name: params[:federated_server_name],
            mode: params[:mode],
            dbname: params[:dbname],
            host: params[:host],
            port: params[:port],
            username: params[:username],
            password: params[:password]
          )

          response.headers['Content-Location'] = "#{request.path}/#{federated_server[:federated_server_name]}"

          render_jsonp({}, 201)
        end

        def show_federated_server
          @federated_server[:password] = '********'
          render_jsonp(@federated_server, 200)
        end

        def update_federated_server
          if @federated_server.empty?
            @federated_server = @service.register_server(
              federated_server_name: params[:federated_server_name],
              mode: params[:mode],
              dbname: params[:dbname],
              host: params[:host],
              port: params[:port],
              username: params[:username],
              password: params[:password]
            )

            response.headers['Content-Location'] = "#{request.path}/#{@federated_server[:federated_server_name]}"

            return render_jsonp({}, 201)
          end

          @federated_server = @service.update_server(
            federated_server_name: params[:federated_server_name],
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
          @service.unregister_server(federated_server_name: params[:federated_server_name])
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

        def register_remote_table
          remote_table = @service.register_table(
            federated_server_name: params[:federated_server_name],
            remote_schema_name: params[:remote_schema_name],
            remote_table_name: params[:remote_table_name],
            local_table_name_override: params[:local_table_name_override].empty? ? params[:remote_table_name] : params[:local_table_name_override],
            id_column_name: params[:id_column_name],
            geom_column_name: params[:geom_column_name],
            webmercator_column_name: params[:webmercator_column_name]
          )

          response.headers['Content-Location'] = "#{request.path}/#{remote_table[:remote_table_name]}"

          render_jsonp({}, 201)
        end

        def show_remote_table
          render_jsonp(@remote_table, 200)
        end

        private

        def load_user
          @user = ::User.where(id: current_viewer.id).first
        end

        def load_service
          @service = Carto::FederatedTablesService.new(user: @user)
        end

        def load_params(default_order:, valid_order_params:)
          @page, @per_page, @order, @direction = page_per_page_order_params(
            valid_order_params,
            default_order: default_order,
            default_order_direction: 'asc'
          )
        end

        def load_federated_server
          @federated_server = @service.get_server(federated_server_name: params[:federated_server_name])
        end

        def check_federated_server
          raise Carto::LoadError.new("Federated server key not found: #{params[:federated_server_name]}") if @federated_server.empty?
        end

        def load_remote_table
          @remote_table = @service.get_remote_table(
            federated_server_name: params[:federated_server_name],
            remote_schema_name: params[:remote_schema_name],
            remote_table_name: params[:remote_table_name]
          )
        end

        def check_remote_table
          raise Carto::LoadError.new("Remote table key not found: #{params[:federated_server_name]}/#{params[:remote_schema_name]}.#{params[:remote_table_name]}") if @remote_table.empty?
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

module Carto
  module Api
    module Public
      class ConnectionsController < Carto::Api::Public::ApplicationController
        extend Carto::DefaultRescueFroms

        before_action :load_user
        before_action :load_manager

        setup_default_rescues
        # TODO: rescuers from ConnectionManager exceptions to be defined, e.g.
        # rescue_from Carto::ConnectionNotFoundError, with: :rescue_from_connection_not_found
        rescue_from ActiveRecord::RecordInvalid, with: :rescue_from_connection_not_found

        respond_to :json

        def index
          render_jsonp(@connection_manager.list_connections, 200)
        end

        def list_connectors
          render_jsonp(@connection_manager.list_connectors, 200)
        end

        def show
          render_jsonp(@connection_manager.show_connection(params[:id]), 200)
        end

        def create
          if params[:name].present? || params[:parameters].present?
            connection = @connection_manager.create_db_connection(
              name: params[:name],
              provider: params[:connector],
              parameters: params[:parameters]
            )
            render_jsonp({ id: connection.id }, 201)
          else
            # initiate creation of OAuth connection
            render_jsonp({ auth_url: @connection_manager.create_oauth_connection_get_url(service: params[:connector]) })
          end
        end

        def destroy
          connection = @connection_manager.fetch_connection(params[:id])
          connection.destroy!
          head :ok
        end

        def update
          @connection_manager.update_db_connection(id: params[:id], parameters: params[:parameters], name: params[:name])
          head :ok
        end

        def check_oauth
          service = params[:service]
          connection = @connection_manager.find_oauth_connection(service)
          # shouldn't it return a presented connection? and raise an exception if not found?
          if connection
            render_jsonp(@connection_manager.present_connection(connection), 200)
          else
            render_jsonp({ errors: "OAuth connection for #{service} not found" }, 404)
          end
        end

        def dryrun
          connection = @connection_manager.show_connection(params[:id])
          # TODO: check connection.type, must be a db-conector
          provider_id = connection[:connector]
          parameters = build_connector_parameters(provider_id, params)
          if Carto::Connector.dry_run?(provider_id)
            connector = Carto::Connector.new(parameters: parameters, user: current_user, logger: nil)
            result = connector.dry_run
            if result[:error]
              result = { errors: result.message }
              code = 400
            else
              result = result.except(:client_error, :error)
              code = 200
            end
            render_jsonp(result, code)
          else
            render_jsonp({ errors: "Provider #{provider_id} doesn't support dry runs" }, 422)
          end
        end

        private

        def build_connector_parameters(provider_id, request_params)
          connector_parameters = {
            provider: provider_id,
            connection_id: request_params[:id]
          }
          provider_information = Carto::Connector.information(provider_id)
          provider_information[:parameters].each do |key, _value|
            connector_parameters[key.to_sym] = params[key.to_sym] if params[key.to_sym].present?
          end
          connector_parameters
        end

        def rescue_from_connection_not_found(exception)
          render_jsonp({ errors: exception.message }, 404)
        end

        def load_user
          @user = Carto::User.find(current_viewer.id)
        end

        def load_manager
          @connection_manager = Carto::ConnectionManager.new(@user)
        end
      end
    end
  end
end

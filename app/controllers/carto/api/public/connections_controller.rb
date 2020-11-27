module Carto
  module Api
    module Public
      class ConnectionsController < Carto::Api::Public::ApplicationController
        extend Carto::DefaultRescueFroms

        before_action :load_user
        before_action :load_manager

        # TODO: rescuers from ConnectionManager exceptions to be defined, e.g.
        # rescue_from Carto::ConnectionNotFoundError, with: :rescue_from_connection_not_found
        rescue_from ActiveRecord::RecordInvalid, with: :rescue_from_connection_not_found

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
          connection = @connection_manager.create_db_connection(
            name: params[:name],
            provider: params[:connector],
            parameters: params[:parameters]
          )
          render_jsonp({ id: connection.id }, 201)
        end

        def destroy
          connection = Carto::Connection.find(params[:id])
          connection.destroy!
          head :ok
        end

        # # TODO: three endpoints for OAuth connection creation

        # # 1. used both for checking if a connection already exists (then, for dual, presence of parameters should be checked to see if the connection is really complete or requires parameters assignment)
        # #    as well as after redirection to create_oauth_url for checking if OAuth was successfully completed
        # def check_oauth
        #   service = params[:service]
        #   connection = @connection_manager.find_oauth_connection(service)
        #   # shouldn't it return a presented connection?
        #   if connection
        #     render_jsonp(@connection_manager.present_connection(connection), 200)
        #   else
        #     # shouldn't it raise some exception
        #     # TODO: return 404 or ...
        #   end
        # end

        # # 2. used for initiating creation of a new connection; obtain auth_url to redirect the user to
        # # should be a POST; may delete existing connection
        # # this funcionality could be included in the create action, either adding a type parameter, or
        # # with automatic recognition of the connector type
        # def create_oauth_url
        #   service = params[:service]
        #   render_jsonp({ auth_url: @connection_manager.create_oauth_connection_get_url(service: service) })
        # end

        # # 3. used, in the case of dual connection (bigquery), after checking call 1, to
        # # assign connection parameters that the user should provide
        # # should be a PUT;
        # # this could be assimilated to a general update method
        # def assign_db_parameters_to_oauth_service
        #   service = params[:service]
        #   parameters = params[:parameters]
        #   connection = @connection_manager.assign_db_parameters(service: servive, parameters: parameters)
        #   # shouldn't it return a presented connection?
        #   render_jsonp(@connection_manager.present_connection(connection), 200)
        # end

        private

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

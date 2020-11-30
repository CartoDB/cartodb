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
          @connection_manager.update_db_connection(id: params[:id], parameters: params[:parameters])
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

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

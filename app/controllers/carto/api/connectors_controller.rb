# encoding: utf-8

module Carto
  module Api
    class ConnectorsController < ::Api::ApplicationController

      MAX_LISTED_TABLES = 500

      ssl_required :index, :show, :tables

      def index
        render_jsonp(Carto::Connector.providers(current_user))
      end

      def show
        provider_id = params[:provider_id]
        begin
          information = Carto::Connector.information(provider_id)
          render_jsonp(information)
        rescue Carto::Connector::InvalidParametersError
          render_jsonp({ errors: "Provider #{provider_id} unknown" }, 422)
        end
      end

      def connect
        provider_id = params[:provider_id]
        parameters = build_connection_parameters(params)
        begin
          connector = Carto::Connector.new(parameters, user: current_user, logger: nil)
          render_jsonp({"connected": connector.check_connection})
        rescue
          render_jsonp({ errors: "Error connecting to provider #{provider_id}, check connection parameters" }, 400)
        end
      end

      def tables
        provider_id = params[:provider_id]
        parameters = build_connection_parameters(params)
        if Carto::Connector.list_tables?(provider_id)
          connector = Carto::Connector.new(parameters, user: current_user, logger: nil)
          render_jsonp(connector.list_tables(MAX_LISTED_TABLES))
        else
          render_jsonp({ errors: "Provider #{provider_id} doesn't support list tables" }, 422)
        end
      end

      private

      def build_connection_parameters(request_params)
        parameters = {}
        parameters[:provider] = request_params[:provider_id]
        parameters[:connection] = {}
        parameters[:connection][:server] = request_params[:server]
        parameters[:connection][:port] = request_params[:port]
        parameters[:connection][:database] = request_params[:database]
        parameters[:connection][:username] = request_params[:username]
        if request_params[:password].blank?
          parameters[:connection][:password] = ''
        else
          parameters[:connection][:password] = request_params[:password]
        end
        parameters
      end
    end
  end
end

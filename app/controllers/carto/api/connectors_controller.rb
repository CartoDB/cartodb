# encoding: utf-8

module Carto
  module Api
    class ConnectorsController < ::Api::ApplicationController

      MAX_LISTED_TABLES = 500

      ssl_required :index, :show, :tables, :connect

      before_filter :check_availability

      def index
        render_jsonp(Carto::Connector.providers(user: current_user))
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
        parameters = build_connection_parameters(provider_id, params)
        begin
          connector = Carto::Connector.new(parameters, user: current_user, logger: nil)
          render_jsonp({"connected": connector.check_connection})
        rescue Carto::Connector::InvalidParametersError => e
          render_jsonp({ errors: e.message }, 422)
        rescue
          render_jsonp({ errors: "Error connecting to provider #{provider_id}, check connection parameters" }, 400)
        end
      end

      def tables
        provider_id = params[:provider_id]
        parameters = build_connection_parameters(provider_id, params)
        if Carto::Connector.list_tables?(provider_id)
          begin
            connector = Carto::Connector.new(parameters, user: current_user, logger: nil)
            render_jsonp(connector.list_tables(MAX_LISTED_TABLES))
          rescue Carto::Connector::InvalidParametersError => e
            render_jsonp({ errors: e.message }, 422)
          rescue
            render_jsonp({ errors: "Error connecting to provider #{provider_id}, check connection parameters" }, 400)
          end
        else
          render_jsonp({ errors: "Provider #{provider_id} doesn't support list tables" }, 422)
        end
      end

      private

      def build_connection_parameters(provider_id, request_params)
        parameters = {}
        parameters[:provider] = request_params[:provider_id]
        parameters[:connection] = {}
        provider_information = Carto::Connector.information(provider_id)
        provider_information[:parameters]["connection"].each do |key, _value|
          if request_params[key.to_sym].present?
            parameters[:connection][key.to_sym] = request_params[key.to_sym]
          end
        end
        parameters
      end

      def check_availability
        head 404 unless Connector.available?(current_user)
      end
    end
  end
end

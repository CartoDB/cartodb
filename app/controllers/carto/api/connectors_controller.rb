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
        error_code = nil
        connection_res = {connected: false}
        begin
          connector = Carto::Connector.new(parameters, user: current_user, logger: nil)
          connection_res[:connected] = connector.check_connection
          error_code = 200
        rescue Carto::Connector::InvalidParametersError => e
          connection_res[:errors] = e.message
          error_code = 422
        rescue CartoDB::Datasources::AuthError, CartoDB::Datasources::TokenExpiredOrInvalidError => e
          user_account_url = CartoDB.url(self, 'account_user', user: current_user)
          connection_res[:errors] = "Could not connect to Google BigQuery. Please go to #{user_account_url} to check your BigQuery connection"
          error_code = 400
        rescue => e
          connection_res[:errors] = e.message
          error_code = 400
        end
        render_jsonp(connection_res, error_code)
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

      def projects
        provider_id = params[:provider_id]
        parameters = build_connection_parameters(provider_id, params)
        if Carto::Connector.list_projects?(provider_id)
          begin
            connector = Carto::Connector.new(parameters, user: current_user, logger: nil)
            render_jsonp(connector.list_projects)
          rescue Carto::Connector::NoImplementedYet => e
            render_jsonp({ errors: e.message }, 501)
          rescue Carto::Connector::InvalidParametersError => e
            render_jsonp({ errors: e.message }, 422)
          rescue
            render_jsonp({ errors: "Error connecting to provider #{provider_id}, check connection parameters" }, 400)
          end
        else
          render_jsonp({ errors: "Provider #{provider_id} doesn't support list projects" }, 422)
        end
      end

      def project_tables
        provider_id = params[:provider_id]
        project = params[:project_id]
        parameters = build_connection_parameters(provider_id, params)
        if Carto::Connector.list_tables?(provider_id)
          begin
            connector = Carto::Connector.new(parameters, user: current_user, logger: nil)
            render_jsonp(connector.list_tables_by_project(project))
          rescue Carto::Connector::NoImplementedYet => e
            render_jsonp({ errors: e.message }, 501)
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
        provider_information = Carto::Connector.information(provider_id)
        if provider_information[:parameters]["connection"].present?
          parameters[:connection] = {}
          provider_information[:parameters]["connection"].each do |key, _value|
            if request_params[key.to_sym].present?
              parameters[:connection][key.to_sym] = request_params[key.to_sym]
            end
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

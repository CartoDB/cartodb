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
        begin
          connection_res = {connected: false}
          provider_id = params[:provider_id]
          parameters = build_connection_parameters(provider_id, params)
          error_code = nil
          connector = Carto::Connector.new(parameters: parameters, user: current_user, logger: nil)
          connection_res[:connected] = connector.check_connection
          error_code = 200
        rescue Carto::Connector::InvalidParametersError => e
          connection_res[:errors] = e.message
          error_code = 422
        rescue CartoDB::Datasources::AuthError, CartoDB::Datasources::TokenExpiredOrInvalidError => e
          user_account_url = CartoDB.url(self, 'account_user', user: current_user)
          connection_res[:errors] = "Could not connect to Google BigQuery. Please go to #{user_account_url} to check your BigQuery connection"
          error_code = 400
        rescue StandardError => e
          connection_res[:errors] = e.message
          error_code = 400
        end
        render_jsonp(connection_res, error_code)
      end

      def tables
        begin
          provider_id = params[:provider_id]
          parameters = build_connection_parameters(provider_id, params)
          if Carto::Connector.list_tables?(provider_id)
            connector = Carto::Connector.new(parameters: parameters, user: current_user, logger: nil)
            render_jsonp(connector.list_tables(MAX_LISTED_TABLES))
          else
            render_jsonp({ errors: "Provider #{provider_id} doesn't support list tables" }, 422)
          end
        rescue Carto::Connector::InvalidParametersError => e
          render_jsonp({ errors: e.message }, 422)
        rescue StandardError => e
          render_jsonp({ errors: "Error connecting to provider #{provider_id}, #{e}" }, 400)
        end
      end

      def projects
        begin
          provider_id = params[:provider_id]
          parameters = build_connection_parameters(provider_id, params)
          if Carto::Connector.list_projects?(provider_id)
            connector = Carto::Connector.new(parameters: parameters, user: current_user, logger: nil)
            render_jsonp(connector.list_projects)
          else
            render_jsonp({ errors: "Provider #{provider_id} doesn't support list projects" }, 422)
          end
        rescue Carto::Connector::NotImplemented => e
          render_jsonp({ errors: e.message }, 501)
        rescue Carto::Connector::InvalidParametersError => e
          render_jsonp({ errors: e.message }, 422)
        rescue StandardError => e
          render_jsonp({ errors: "Error connecting to provider #{provider_id}: #{e}" }, 400)
        end
      end

      def project_datasets
        begin
          provider_id = params[:provider_id]
          project_id = params[:project_id]
          parameters = build_connection_parameters(provider_id, params.except(:project_id))
          if Carto::Connector.list_projects?(provider_id)
            connector = Carto::Connector.new(parameters: parameters, user: current_user, logger: nil)
            render_jsonp(connector.list_project_datasets(project_id))
          else
            render_jsonp({ errors: "Provider #{provider_id} doesn't support list projects/datasets" }, 422)
          end
        rescue Carto::Connector::NotImplemented => e
          render_jsonp({ errors: e.message }, 501)
        rescue Carto::Connector::InvalidParametersError => e
          render_jsonp({ errors: e.message }, 422)
        rescue StandardError => e
          render_jsonp({ errors: "Error connecting to provider #{provider_id}: #{e}" }, 400)
        end
      end

      def project_dataset_tables
        begin
          provider_id = params[:provider_id]
          project_id = params[:project_id]
          dataset_id = params[:dataset_id]
          parameters = build_connection_parameters(provider_id, params.except(:project_id, :dataset_id))
          if Carto::Connector.list_projects?(provider_id)
            connector = Carto::Connector.new(parameters: parameters, user: current_user, logger: nil)
            render_jsonp(connector.list_project_dataset_tables(project_id, dataset_id))
          else
            render_jsonp({ errors: "Provider #{provider_id} doesn't support list projects/datasets/tables" }, 422)
          end
        rescue Carto::Connector::NotImplemented => e
          render_jsonp({ errors: e.message }, 501)
        rescue Carto::Connector::InvalidParametersError => e
          render_jsonp({ errors: e.message }, 422)
        rescue StandardError => e
          render_jsonp({ errors: "Error connecting to provider #{provider_id}: #{e}" }, 400)
        end
      end

      def dryrun
        begin
          provider_id = params[:provider_id]
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
        rescue Carto::Connector::NotImplemented => e
          render_jsonp({ errors: e.message }, 501)
        rescue Carto::Connector::InvalidParametersError => e
          render_jsonp({ errors: e.message }, 422)
        rescue StandardError => e
          render_jsonp({ errors: "Error connecting to provider #{provider_id}: #{e.message}" }, 400)
        end
      end

      private

      # Put connection parameters into a single `connection` parameter, along with `provider`
      def build_connection_parameters(provider_id, request_params)
        parameters = {}
        parameters[:provider] = provider_id
        provider_information = Carto::Connector.information(provider_id)
        if provider_information[:parameters]["connection"].present?
          parameters[:connection] = {}
          provider_information[:parameters]["connection"].each do |key, _value|
            parameters[:connection][key.to_sym] = request_params[key.to_sym] if request_params[key.to_sym].present?
          end
        end
        parameters
      end

      # Put connector parameter along with `provider`
      def build_connector_parameters(provider_id, request_params)
        parameters = {}
        if request_params[:provider].present? && request_params[:provider] != provider_id
          raise Carto::Connector::InvalidParametersError.new(message: "Provider doesn't match")
        end
        parameters[:provider] = provider_id
        provider_information = Carto::Connector.information(provider_id)
        provider_information[:parameters].each do |key, _value|
          parameters[key.to_sym] = request_params[key.to_sym] if request_params[key.to_sym].present?
        end
        parameters[:connection_id] = request_params[:connection_id] if request_params[:connection_id].present?
        parameters
      end

      def check_availability
        head 404 unless Connector.available?(current_user)
      end
    end
  end
end

require_relative '../connection_adapter'

module Carto
  class ConnectionAdapter
    # Connection adapter for BigQuery:
    # * Manages BigQuery connector specifics (parameter validation & confidentiality, singletonness)
    # * Saves credentials in redis
    # * Manages Spatial Extension Setup
    class BigQuery < ConnectionAdapter

      BQ_CONFIDENTIAL_PARAMS = %w(service_account refresh_token access_token).freeze
      BQ_ADVANCED_CENTRAL_ATTRIBUTE = :bq_advanced
      BQ_ADVANCED_PROJECT_CENTRAL_ATTRIBUTE = :bq_advanced_project

      def initialize(connection)
        super(connection, confidential_parameters: BQ_CONFIDENTIAL_PARAMS)
      end

      def singleton?
        true
      end

      def complete?
        return false if incomplete?

        super
      end

      def errors
        errors = super
        if @connection.connection_type == Carto::Connection::TYPE_DB_CONNECTOR
          if @connection.parameters['refresh_token'].present?
            errors << 'Parameter refresh_token not supported for db-connection; use OAuth connection instead'
          end
          if @connection.parameters['access_token'].present?
            errors << 'Parameter access_token not supported through connections; use import API'
          end
        end
        if @connection.connection_type == Carto::Connection::TYPE_OAUTH_SERVICE
          if complete? && @connection.parameters['billing_project'].blank?
            errors << "Parameter 'billing_project' must be assigned"
          end
        end
        # TODO: unless @connection.shared?
        other_connections = if @connection.connection_type == Carto::Connection::TYPE_DB_CONNECTOR
          @connection.user.oauth_connections
        else
          @connection.user.db_connections
        end
        if other_connections.where(connector: 'bigquery').exists?
          errors << 'Only a BigQuery connection (either OAuth or Service Account) per user is permitted'
        end
        # TODO: end
        errors
      end

      def create
        super
        return if @connection.parameters.blank?

        create_spatial_extension_setup
      end

      def destroy
        super
        return if @connection.parameters.blank?

        remove_spatial_extension_setup
      end

      def update
        super
        return if @connection.parameters.blank?

        update_spatial_extension_setup
      end

      # If necessary this is how to check if the spatial extension has been successfully activated:
      # def bq_advanced?
      #   central_user_data = Cartodb::Central.new.get_user(@user.username)
      #   central_user_data[BQ_ADVANCED_CENTRAL_ATTRIBUTE.to_s]
      # end

      def adapt_parameters(connector_parameters)
        super(connector_parameters)

        if @connection.connection_type == Carto::Connection::TYPE_OAUTH_SERVICE
          # BQ db connector expects a refresh_token parameter for using OAuth
          connection_parameters = connector_parameters[:connection].dup || {}
          connection_parameters['refresh_token'] ||= @connection.token
          connector_parameters[:connection] = connection_parameters
        elsif legacy_oauth_db_connection?(connector_parameters)
          # Old BQ Oauth imports didn't have any parameter
          connection_parameters = connector_parameters[:connection].dup || {}
          connection_parameters['refresh_token'] = @connection.user.oauths&.select(@connection.connector)&.token
          connector_parameters[:connection] = connection_parameters
        end
      end

      private

      def legacy_oauth_db_connection?(connector_parameters)
        credentials = [:service_token, :refresh_token, :access_token]
        credentials += credentials.map(&:to_s)
        connection_parameters = (connector_parameters[:connection].dup || {}).keys
        (credentials & connection_parameters).empty?
      end

      def incomplete?
        # An OAuth connection may be incomplete: it's created when the token is registered,
        # but necessary parameters may be assigned later.
        # And incomplete connection is not usuable until the parameters have been assigned.
        return @connection.parameters.nil? if @connection.connection_type == Carto::Connection::TYPE_OAUTH_SERVICE

        false
      end

      def central
        @central ||= Cartodb::Central.new
      end

      def create_spatial_extension_setup
        central.update_user(
          @connection.user.username,
          BQ_ADVANCED_CENTRAL_ATTRIBUTE => true,
          BQ_ADVANCED_PROJECT_CENTRAL_ATTRIBUTE => @connection.parameters['billing_project']
        )
      end

      def remove_spatial_extension_setup
        central.update_user(
          @connection.user.username,
          BQ_ADVANCED_CENTRAL_ATTRIBUTE => false,
          BQ_ADVANCED_PROJECT_CENTRAL_ATTRIBUTE => nil
        )
      end

      def update_spatial_extension_setup
        if @connection.changes[:parameters]
          old_parameters, new_parameters = @connection.changes[:parameters]
          old_parameters ||= {}
          new_parameters ||= {}
          if old_parameters['billing_project'] != new_parameters['billing_project']
            central.update_user(
              @connection.user.username,
              BQ_ADVANCED_CENTRAL_ATTRIBUTE => true,
              BQ_ADVANCED_PROJECT_CENTRAL_ATTRIBUTE => new_parameters['billing_project']
            )
          end
        end
      end

      def redis_metadata?
        complete?
      end

      def connection_credentials_keys
        BQ_CONFIDENTIAL_PARAMS
      end

      def connection_credentials
        return super unless @connection.connection_type == Carto::Connection::TYPE_OAUTH_SERVICE

        { 'refresh_token': @connection.token }
      end

      # Temporally we need to mantain this redis key until maps api is updated
      def bigquery_redis_key
        "google:bq_settings:#{@connection.user.username}"
      end

      def update_redis_metadata
        super

        return unless @connection.parameters.present?

        if @connection.parameters['service_account'].present?
          $users_metadata.hmset(
            bigquery_redis_key,
            'service_account', @connection.parameters['service_account'],
            'billing_project', @connection.parameters['billing_project']
          )
        end
      end

      def remove_redis_metadata
        super

        $users_metadata.del bigquery_redis_key
      end
    end
  end
end

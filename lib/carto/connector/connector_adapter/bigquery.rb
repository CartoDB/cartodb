require_relative '../connection_adapter'

module Carto
  class ConnectionAdapter
    # Connection adapter for BigQuery:
    # * Manages BigQuery connector specifics (parameter validation & confidentiality, singletonness)
    # * Saves credentials in redis
    # * Manages Spatial Extension Setup
    class BigQuery < ConnectionAdapter
      BQ_CONFIDENTIAL_PARAMS = %w(service_account refresh_token access_token)
      NON_CONNECTOR_PARAMETERS = []
      BQ_ADVANCED_CENTRAL_ATTRIBUTE = :bq_advanced
      BQ_CONNECTOR = 'bigquery'.freeze

      def initialize(connection)
        super(connection, confidential_parameters: BQ_CONFIDENTIAL_PARAMS)
      end

      def filtered_connection_parameters
        @connection.parameters.except(*NON_CONNECTOR_PARAMETERS)
      end

      def singleton?
        true
      end

      def errors
        errors = super
        if @connector.connection_type == Carto::Connection::TYPE_DB_CONNECTOR
          errors << "Parameter refresh_token not supported for db-connection; use OAuth connection instead" if @connection.parameters['refresh_token'].present?
          errors << "Parameter access_token not supported through connections; use import API" if @connection.parameters['access_token'].present?
        end
        errors
      end

      def create
        super
        update_redis_metadata(connection)
        create_spatial_extension_setup(connection)
      end

      def destroy
        super
        remove_redis_metadata
        remove_spatial_extension_setup
      end

      def update
        super
        update_redis_metadata
        update_spatial_extension_setup
      end

      # If necessary this is how to check if the spatial extension has been successfully activated:
      # def bq_advanced?
      #   central_user_data = Cartodb::Central.new.get_user(@user.username)
      #   central_user_data[BQ_ADVANCED_CENTRAL_ATTRIBUTE.to_s]
      # end

      private

      def create_spatial_extension_setup
        central = Cartodb::Central.new
        central.update_user(@connection.user.username, BQ_ADVANCED_CENTRAL_ATTRIBUTE => true)
      end

      def remove_spatial_extension_setup
        central = Cartodb::Central.new
        central.update_user(@connection.user.username, BQ_ADVANCED_CENTRAL_ATTRIBUTE => false)
      end

      def update_spatial_extension_setup
        # Nothing to do since all users have inconditionally the spatial extension now
      end

      def update_redis_metadata
        if @connection.connector == BQ_CONNECTOR && @connection.parameters['service_account'].present?
          $users_metadata.hset bigquery_redis_key, 'service_account', @connection.parameters['service_account']
        end
      end

      def remove_redis_metadata
        if @connection.connector == BQ_CONNECTOR
          $users_metadata.del bigquery_redis_key
        end
      end

      def bigquery_redis_key
        "google:bq_settings:#{@connection.user.username}"
      end
    end
  end
end

require 'googleauth'
require 'google/apis/iam_v1'
require 'google/apis/iamcredentials_v1'
require 'google/apis/bigquery_v2'
require 'google/apis/cloudresourcemanager_v1'

require_relative 'service_factory'

module Carto
  module Gcloud
    class SpatialExtensionSetup
      HARDCODED_LIMITS_TABLE = 'bqcartost.config.limits'.freeze
      HARDCODED_MAX_BYTES = 250000000000

      def initialize(role:, datasets:, management_key: nil)
        @role = role
        @datasets = datasets
        @service_factory = Carto::Gcloud::ServiceFactory.new(management_key)
        @bq_service = @service_factory.get(Google::Apis::BigqueryV2::BigqueryService)
      end

      def create(connection)
        check_connection!(connection)
        raise "Invalid connection for Spatial Extension: #{connection.connector}" unless connection.connector == 'bigquery'

        email = connection.parameters['email']
        @datasets.each do |dataset|
          project_id, dataset_id = dataset.split('.')
          grant_user_access_to_bigquery_dataset(project_id, dataset_id, email, @role)
        end

        # FIXME: temporary hardcoded limits for test purposes
        project_id, dataset_id, table_id = HARDCODED_LIMITS_TABLE.split('.')
        insert_row(
          project_id, dataset_id, table_id,
          email: email,
          connection_id: connection.id,
          max_bytes_processed: HARDCODED_MAX_BYTES,
          start_billing_period: rand(30) + 1
        )
      end

      def remove(connection)
        check_connection!(connection)

        email = connection.parameters['email']
        @datasets.each do |dataset|
          project_id, dataset_id = dataset.split('.')
          revoke_user_access_from_bigquery_dataset(project_id, dataset_id, email, @role)
        end

        # FIXME: temporary hardcoded limits for test purposes
        project_id, dataset_id, table_id = HARDCODED_LIMITS_TABLE.split('.')
        delete_row(project_id, dataset_id, table_id, connection.id)
      end

      private

      def insert_row(project_id, dataset_id, table_id, row)
        sql = %{
          INSERT INTO `#{project_id}.#{dataset_id}.#{table_id}`(
            email,
            connection_id,
            max_bytes_processed,
            start_billing_period
          ) VALUES (
            '#{row[:email]}',
            '#{row[:connection_id]},
            #{row[:max_bytes_processed]},
            #{row[:start_billing_period]}
          )
        }
        query = Google::Apis::BigqueryV2::QueryRequest.new
        query.query = sql
        query.use_legacy_sql = false
        # FIXME: which project should perform this job?
        @bq_service.query_job(project_id, query)
      end

      def delete_row(project_id, dataset_id, table_id, connection_id)
        sql = "DELETE FROM `#{project_id}.#{dataset_id}.#{table_id}` WHERE connection_id='#{connection_id}'"
        query = Google::Apis::BigqueryV2::QueryRequest.new
        query.query = sql
        query.use_legacy_sql = false
        # FIXME: which project should perform this job?
        @bq_service.query_job(project_id, query)
      end

      def check_connection!(connection)
        errors = []
        errors << "Invalid connection type: #{connection.connector}" unless connection.connector == 'bigquery'
        if errors.empty?
          errors << "Missing email" unless connection.parameters['email'].present?
        end
        if errors.present?
          raise "Invalid connection for Spatial Extension:\n#{errors.join("\n")}"
        end
      end

      def grant_user_access_to_bigquery_dataset(project_id, dataset_id, email, role)
        dataset = @bq_service.get_dataset(project_id, dataset_id)
        dataset.access.push(bigquery_dataset_access(role, email))
        @bq_service.update_dataset(project_id, dataset_id, dataset)
      end

      def revoke_user_access_from_bigquery_dataset(project_id, dataset_id, email, role)
        dataset = @bq_service.get_dataset(project_id, dataset_id)
        dataset.access = dataset.access.reject do |access|
          access.role == role && access.user_by_email == email
        end
        @bq_service.update_dataset(project_id, dataset_id, dataset)
      rescue Google::Apis::ClientError => e
        # We don't want to stop the whole deleting process in this case
        raise unless e.status_code == 404
      end

      def bigquery_dataset_access(role, email)
        access = Google::Apis::BigqueryV2::Dataset::Access.new
        access.role = role
        access.user_by_email = email
        return access
      end
    end
  end
end
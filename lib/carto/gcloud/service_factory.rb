require 'googleauth'
require 'google/apis/iam_v1'
require 'google/apis/iamcredentials_v1'
require 'google/apis/bigquery_v2'
require 'google/apis/cloudresourcemanager_v1'

module Carto
  module Gcloud
    class ServiceFactory
      MASTER_SCOPES = %w(https://www.googleapis.com/auth/cloud-platform
                       https://www.googleapis.com/auth/bigquery).freeze
      MAX_CLIENT_RETRIES = 3
      MAX_TIMEOUT = 5
      AUTH_URL = 'https://www.googleapis.com/auth/cloud-platform'.freeze

      def initialize(key = nil)
        if key.present?
          @authorizer = Google::Auth::ServiceAccountCredentials.make_creds(
            json_key_io: StringIO.new(key),
            scope: MASTER_SCOPES) if key.present?
        else
          # default authorization (env vars or instance service account)
          @authorizer = Google::Auth.get_application_default([AUTH_URL])
        end
        @client_options = service_client_options
        @request_options = service_request_options
      end

      def get(service_class)
        service = service_class.new
        service.client_options = @client_options
        service.request_options = @request_options
        service.authorization = @authorizer
        service
      end

      private

      def service_client_options
        client_options = Google::Apis::ClientOptions.new
        client_options.open_timeout_sec = MAX_TIMEOUT
        client_options.read_timeout_sec = MAX_TIMEOUT
        client_options
      end

      def service_request_options
        request_options = Google::Apis::RequestOptions.new
        request_options.retries = MAX_CLIENT_RETRIES
        request_options
      end

    end
  end
end
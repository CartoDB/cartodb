require 'signet/oauth_2/client'
require 'google/apis/bigquery_v2'

module Carto
  class BqClient
    SCOPES = %w(https://www.googleapis.com/auth/cloud-platform
      https://www.googleapis.com/auth/bigquery).freeze
    MAX_CLIENT_RETRIES = 3
    MAX_TIMEOUT = 3600

    def initialize(key)
      authorizer = Google::Auth::ServiceAccountCredentials.make_creds(
        json_key_io: StringIO.new(key),
        scope: SCOPES)
      client_options = Google::Apis::ClientOptions.new
      client_options.open_timeout_sec = MAX_TIMEOUT
      client_options.read_timeout_sec = MAX_TIMEOUT
      request_options = Google::Apis::RequestOptions.new
      request_options.retries = MAX_CLIENT_RETRIES
      @service = Google::Apis::BigqueryV2::BigqueryService.new
      @service.client_options = client_options
      @service.request_options = request_options
      @service.authorization = authorizer
    end

    def table(dataset_id)
      project, dataset, table = dataset_id.split('.')
      @service.get_table(project, dataset, table)
    end
  end
end

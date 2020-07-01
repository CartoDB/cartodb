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

    def query(billing_project_id, sql, dry_run=false)
      query = Google::Apis::BigqueryV2::QueryRequest.new
      query.query = sql
      query.dry_run = dry_run
      query.use_legacy_sql = false
      # job = @service.query_job(billing_project_id, query)
      # job.wait_until_done!
      # data = job.query_results
      data = @service.query_job(billing_project_id, query).rows
      data.each do |row|
        yield row
      end
      # data = data.next if data.next?
    end

    def table(dataset_id)
      project, dataset, table = dataset_id.split('.')
      @service.get_table(project, dataset, table)
    end
  end
end

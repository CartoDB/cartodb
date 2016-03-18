require_relative '../../../sql-api/batch_sql_api'

module CartoDB
  module Importer2
    class BatchApiException; end
    class BatchApiQuery

      # TODO Check the number of rows to reduce the number
      POLLING_TIME = 5.seconds
      DEFAULT_TIMEOUT = 5.hours

      def initialize(username, api_key)
        @sql_api_client = CartoDB::BatchSQLApi.new({
          protocol: 'https',
          username: username,
          api_key: api_key
        })
      end

      def execute(query)
        @response = @sql_api_client.execute(query)
        @started_at = Time.now
        until ['done', 'failed', 'cancelled'].include? status
          if timeout?
            raise BatchApiException("Timeout executing the job #{status}")
          end
          sleep POLLING_TIME
          @response = check_status(job_id)
        end
      end

      def status()
        @response['status']
      end

      def job_id()
        @response['job_id']
      end

      private

      def check_status(job_id)
        response = @sql_api_client.status(job_id)
        status = response["status"]
        raise BatchApiException(response["failed_reason"]) if status == 'failed'
        response
      end

      def timeout?
        (Time.now - @started_at) > default_timeout
      end
    end
  end
end

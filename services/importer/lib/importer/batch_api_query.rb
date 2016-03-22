require_relative '../../../sql-api/batch_sql_api'
require 'active_support/time'

module CartoDB
  module Importer2
    class BatchApiException; end
    class BatchApiQuery

      DEFAULT_TIMEOUT = 5.hours
      MAX_POLLING_DELAY_SECONDS = 30

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
        retry_counter = 0
        until ['done', 'failed', 'cancelled'].include? status
          if timeout?
            raise BatchApiException("Timeout executing the job #{status}")
          end
          sleep polling_time(retry_counter)
          @response = check_status(job_id)
          retry_counter += 1
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
        raise BatchApiException.new(response["failed_reason"]) if status == 'failed'
        response
      end

      def timeout?
        (Time.now - @started_at) > DEFAULT_TIMEOUT
      end

      def polling_time(retry_counter)
        sleep_time = 0.25 * 1.5 ** (retry_counter - 1)
        sleep_time > MAX_POLLING_DELAY_SECONDS ? 30 : sleep_time
      end
    end
  end
end

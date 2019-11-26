require 'socket'
require 'carto/configuration'

module Carto
  module Http

    class ResponseLogger
      include Carto::Configuration

      def self.enabled?
        Cartodb.config[:http_client_logs]
      end

      def initialize(tag)
        @tag = tag
        @hostname = Socket.gethostname
      end

      def log(response)
        payload = {
          tag: @tag,
          hostname: @hostname,
          method: (response.request.options[:method] || :get).to_s, # the default typhoeus method is :get
          request_url: response.request.url,
          total_time: response.total_time,
          response_code: response.code,
          response_body_size: response.body.nil? ? 0 : response.body.size
        }
        logger.info(payload.to_json)
      end

      def logger
        @@logger ||= CartoDB.unformatted_logger(log_file_path('http_client.log'))
      end
    end

  end
end

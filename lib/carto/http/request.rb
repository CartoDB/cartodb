# encoding: utf-8

require 'typhoeus'

module Carto
  module Http

    #Wraps a typhoeus request and logs it
    class Request

      def initialize(logger, url, options = {})
        @logger = logger
        @typhoeus_request = Typhoeus::Request.new(url, options)
      end

      def run
        response = @typhoeus_request.run
        @logger.log(response)
        response
      end

      def url
        @typhoeus_request.url
      end

      def options
        @typhoeus_request.options
      end

      def on_headers(&block)
        @typhoeus_request.on_headers(&block)
      end

      def on_body(&block)
        @typhoeus_request.on_body(&block)
      end

      def on_complete(&block)
        @typhoeus_request.on_complete(&block)
      end
    end

  end
end

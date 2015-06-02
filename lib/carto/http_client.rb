# encoding: utf-8

require 'typhoeus'

module Carto
  # Wrapper on top of Typhoeus
  class HttpClient

    attr_reader :tag

    def initialize(tag)
      @tag = tag
    end

    # Returns a wrapper to a typhoeus request object
    def request(url, options = {})
      Request.new(self, url, options)
    end

    def get(url, options = {})
      request = Request.new(self, url, options.merge(method: :get))
      request.run
    end

    def post(url, options = {})
      request = Request.new(self, url, options.merge(method: :post))
      request.run
    end

    def head(url, options = {})
      request = Request.new(self, url, options.merge(method: :head))
      request.run
    end

    def put(url, options = {})
      request = Request.new(self, url, options.merge(method: :put))
      request.run
    end

    def delete(url, options = {})
      request = Request.new(self, url, options.merge(method: :delete))
      request.run
    end


    private

    class Request

      def initialize(http_client, url, options = {})
        @http_client = http_client
        @typhoeus_request = Typhoeus::Request.new(url, options)
      end

      def run
        # TODO: logging here
        @typhoeus_request.run
      end

      def url
        @typhoeus_request.url
      end

      def options
        @typhoeus_request.options
      end
    end

  end
end

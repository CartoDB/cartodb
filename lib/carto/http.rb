# encoding: utf-8

require 'typhoeus'

module Carto
  # Wrapper on top of Typhoeus
  module Http

    class Request

      def initialize(url, options = {})
        # TODO: default params here
        @typhoeus_request = Typhoeus::Request.new(url, options)
      end

      def run
        # TODO: timing here
        @typhoeus_request.run
      end

      def url
        @typhoeus_request.url
      end

      def options
        @typhoeus_request.options
      end

    end

    def self.get(url, options = {})
      request = Request.new(url, options.merge(method: :get))
      request.run
    end

    def self.post(url, options = {})
      request = Request.new(url, options.merge(method: :post))
      request.run
    end

    def self.head(url, options = {})
      request = Request.new(url, options.merge(method: :head))
      request.run
    end

    def self.put(url, options = {})
      request = Request.new(url, options.merge(method: :put))
      request.run
    end

    def self.delete(url, options = {})
      request = Request.new(url, options.merge(method: :delete))
      request.run
    end

  end
end

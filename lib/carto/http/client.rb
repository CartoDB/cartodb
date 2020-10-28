require_relative 'request'
require_relative 'response_logger'
require_relative 'null_logger'
require_relative '../current_request'
require './app/helpers/logger_helper'

module Carto
  module Http

    class Client
      include ::LoggerHelper

      private_class_method :new

      def self.get(tag, extra_options = {})
        logger = build_logger(tag, extra_options)
        new(logger)
      end

      def self.build_logger(tag, extra_options)
        if extra_options[:log_requests] && ResponseLogger.enabled?
          ResponseLogger.new(tag)
        else
          NullLogger.new()
        end
      end

      # Returns a wrapper to a typhoeus request object
      def request(url, options = {})
        set_x_request_id!(options)
        Request.new(@logger, url, options)
      end

      def get(url, options = {})
        perform_request(__method__, url, options)
      end

      def post(url, options = {})
        perform_request(__method__, url, options)
      end

      def head(url, options = {})
        perform_request(__method__, url, options)
      end

      def put(url, options = {})
        perform_request(__method__, url, options)
      end

      def delete(url, options = {})
        perform_request(__method__, url, options)
      end

      # `options` are Typhoeus options. Example: { ssl_verifypeer: false, ssl_verifyhost: 0 }
      def get_file(url, file_path, options = {})
        downloaded_file = File.open file_path, 'wb'
        set_x_request_id!(options)
        request = request(url, options)
        request.on_headers do |response|
          unless response.code == 200
            raise "Request failed. URL: #{url}. File path: #{file_path}. Code: #{response.code}. Body: #{response.body}"
          end
        end
        request.on_body do |chunk|
          downloaded_file.write(chunk)
        end
        request.on_complete do |response|
          unless response.success?
            raise "Request failed. URL: #{url}. File path: #{file_path}. Code: #{response.code}. Body: #{response.body}"
          end
          downloaded_file.close
        end
        request.run

        downloaded_file
      rescue StandardError => e
        log_error(exception: e, url: url, file_path: file_path)
        raise e
      end

      private

      def initialize(logger)
        @logger = logger
      end

      def perform_request(method, url, options = {})
        set_x_request_id!(options)
        request = Request.new(@logger, url, options.merge(method: method))
        request.run
      end

      def set_x_request_id!(options={})
        if request_id
          options[:headers] ||= {}
          options[:headers]['X-Request-ID'] = request_id
        end
        options
      end

      def request_id
        Carto::CurrentRequest.request_id
      end

    end

  end
end

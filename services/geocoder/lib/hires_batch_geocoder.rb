# encoding: utf-8
require 'nokogiri'
require 'csv'
require 'open3'
require 'active_support/core_ext/numeric'
require_relative '../../../lib/carto/http/client'
require_relative 'hires_geocoder_interface'

module CartoDB
  class HiresBatchGeocoder < HiresGeocoderInterface

    DEFAULT_TIMEOUT = 5.hours

    # Options for the csv upload endpoint of the Batch Geocoder API
    UPLOAD_OPTIONS = {
      action: 'run',
      indelim: ',',
      outdelim: ',',
      header: false,
      outputCombined: false,
      outcols: "displayLatitude,displayLongitude"
    }

    # INFO: the request_id is the most important thing to care for batch requests
    # INFO: it is called remote_id in upper layers
    attr_reader   :base_url, :request_id, :app_id, :token, :mailto,
                  :status, :processed_rows, :total_rows, :dir, :input_file

    class ServiceDisabled < StandardError; end


    def initialize(input_csv_file, working_dir)
      @input_file         = input_csv_file
      @dir                = working_dir

      @base_url           = config.fetch('base_url')
      @app_id             = config.fetch('app_id')
      @token              = config.fetch('token')
      @mailto             = config.fetch('mailto')

      @used_batch_request = false

      begin
        @batch_api_disabled = config['batch_api_disabled'] == true
      rescue
        @batch_api_disabled = false
      end
    end

    def run
      started_at = Time.now
      upload

      # INFO: this loop polls for the state of the table_geocoder batch process
      update_status
      until ['completed', 'cancelled'].include? status do
        if (Time.now - started_at) > DEFAULT_TIMEOUT
          begin
            cancel
          ensure
            @status = 'timeout'
          end
        end

        break if ['failed', 'timeout'].include? status

        sleep 5
        update_status
      end

      # TODO: do here all the process_results stuff

    end

    def upload
      assert_batch_api_enabled
      @used_batch_request = true
      response = http_client.post(
        api_url(UPLOAD_OPTIONS),
        body: File.open(input_file,"r").read,
        headers: { "Content-Type" => "text/plain" }
      )
      handle_api_error(response)
      @request_id = extract_response_field(response.body, '//Response/MetaInfo/RequestId')
      # TODO: this is a critical error, deal with it appropriately
      raise 'Could not get the request ID' unless @request_id

      return @request_id
    end

    def used_batch_request?
      @used_batch_request
    end

    def cancel
      assert_batch_api_enabled
      response = http_client.put api_url(action: 'cancel')
      handle_api_error(response)
      @status         = extract_response_field(response.body, '//Response/Status')
      @processed_rows = extract_response_field(response.body, '//Response/ProcessedCount')
      @total_rows     = extract_response_field(response.body, '//Response/TotalCount')
    end

    def update_status
      assert_batch_api_enabled
      response = http_client.get api_url(action: 'status')
      handle_api_error(response)
      @status         = extract_response_field(response.body, '//Response/Status')
      @processed_rows = extract_response_field(response.body, '//Response/ProcessedCount')
      @total_rows     = extract_response_field(response.body, '//Response/TotalCount')
    end

    def assert_batch_api_enabled
      raise ServiceDisabled if @batch_api_disabled
    end

    def result
      return @result unless @result.nil?
      results_filename = File.join(dir, "#{request_id}.zip")
      # TODO: check for status
      stdout, stderr, status  = Open3.capture3('wget', '-nv', '-E', '-O', results_filename, api_url({}, 'result'))
      @result = Dir[File.join(dir, '*')][0]
    end


    private

    def config
      # TODO deal with script/geocoder_test
      Cartodb.config[:geocoder]
    end

    def http_client
      @http_client ||= Carto::Http::Client.get('hires_batch_geocoder', log_requests: true)
    end

    def api_url(arguments, extra_components = nil)
      arguments.merge!(app_id: app_id, token: token, mailto: mailto)
      components = [base_url]
      components << request_id unless request_id.nil?
      components << extra_components unless extra_components.nil?
      components << '?' + URI.encode_www_form(arguments)
      components.join('/')
    end

    def extract_response_field(response, query)
      Nokogiri::XML(response).xpath("#{query}").first.content
    rescue NoMethodError => e
      CartoDB.notify_exception(e)
      nil
    end

    def handle_api_error(response)
      raise "Geocoding API communication failure: #{extract_response_field(response.body, '//Details')}" if response.code != 200
    end # handle_api_errpr

  end # Geocoder
end # CartoDB

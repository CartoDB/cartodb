# encoding: utf-8
require 'nokogiri'
require 'csv'
require 'active_support/core_ext/numeric'
require_relative '../../../lib/carto/http/client'
require_relative 'hires_geocoder_interface'
require_relative 'geocoder_config'

module CartoDB
  class HiresBatchGeocoder < HiresGeocoderInterface

    DEFAULT_TIMEOUT = 5.hours
    POLLING_SLEEP_TIME = 5.seconds
    LOGGING_TIME = 5.minutes

    # Generous timeouts, overriden for big files upload/download
    HTTP_CONNECTION_TIMEOUT = 60
    HTTP_REQUEST_TIMEOUT = 600

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
    attr_reader :base_url, :request_id, :app_id, :token, :mailto,
                :status, :processed_rows, :processed_rows, :successful_processed_rows, :failed_processed_rows,
                :empty_processed_rows, :total_rows, :dir, :input_file

    class ServiceDisabled < StandardError; end


    def initialize(input_csv_file, working_dir, log)
      @input_file = input_csv_file
      @dir = working_dir
      @log = log
      @base_url = config.fetch('base_url')
      @app_id = config.fetch('app_id')
      @token = config.fetch('token')
      @mailto = config.fetch('mailto')
      @used_batch_request = false
      begin
        @batch_api_disabled = config['batch_api_disabled'] == true
      rescue
        @batch_api_disabled = false
      end
    end

    def run
      @log.append_and_store "Started batched Here geocoding job"
      @started_at = Time.now
      upload

      # INFO: this loop polls for the state of the table_geocoder batch process
      update_status
      until ['completed', 'cancelled'].include? status do
        if timeout?
          begin
            cancel
          ensure
            @status = 'timeout'
            @log.append_and_store "Proceding to cancel job due timeout"
          end
        end

        break if ['failed', 'timeout'].include? status

        sleep polling_sleep_time
        update_status
        update_log_stats
      end
      @log.append_and_store "Geocoding Hires job has finished"
    ensure
      # Processed data at the end of the job
      update_log_stats(false)
    end

    def upload
      assert_batch_api_enabled
      @used_batch_request = true
      response = http_client.post(
        api_url(UPLOAD_OPTIONS),
        body: File.open(input_file, "r").read,
        headers: { "Content-Type" => "text/plain" },
        timeout: 5.hours # more than generous timeout for big file upload
      )
      handle_api_error(response)
      @request_id = extract_response_field(response.body, '//Response/MetaInfo/RequestId')
      # TODO: this is a critical error, deal with it appropriately
      raise 'Could not get the request ID' unless @request_id
      @log.append_and_store "Job sent to HERE, job id: #{@request_id}"

      @request_id
    end

    def used_batch_request?
      @used_batch_request
    end

    def cancel
      assert_batch_api_enabled
      response = http_client.put api_url(action: 'cancel')
      handle_api_error(response)
      update_stats(response)
      @log.append_and_store "Job sent to HERE has been cancelled"
    end

    def update_status
      assert_batch_api_enabled
      response = http_client.get api_url(action: 'status')
      handle_api_error(response)
      update_stats(response)
    end

    def assert_batch_api_enabled
      raise ServiceDisabled if @batch_api_disabled
    end

    def result
      return @result unless @result.nil?

      raise 'No request_id provided' unless request_id
      results_filename = File.join(dir, "#{request_id}.zip")
      download_url = api_url({}, 'result')
      # generous timeout for download of results
      request = http_client.request(download_url,
                                    method: :get,
                                    timeout: 5.hours)

      File.open(results_filename, 'wb') do |download_file|

        request.on_headers do |response|
          if response.success? == false
            # TODO: better error handling
            raise 'Download request failed'
          end
        end

        request.on_body do |chunk|
          download_file.write(chunk)
        end

        request.on_complete do |response|
          if response.success? == false
            # TODO: better error handling
            raise 'Download request failed'
          end
        end

        request.run
      end

      @result = results_filename
    end


    private

    def config
      GeocoderConfig.instance.get
    end

    def http_client
      @http_client ||= Carto::Http::Client.get('hires_batch_geocoder',
                                               log_requests: true,
                                               connecttimeout: HTTP_CONNECTION_TIMEOUT,
                                               timeout: HTTP_REQUEST_TIMEOUT)
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

    def extract_numeric_response_field(response, query)
      value = extract_response_field(response, query)
      return nil if value.blank?
      Integer(value)
    rescue ArgumentError => e
      CartoDB.notify_error("Batch geocoder value error", error: e.message, value: value)
      nil
    end

    def handle_api_error(response)
      if response.success? == false
        @failed_processed_rows = number_of_input_file_rows
        raise "Geocoding API communication failure: #{extract_response_field(response.body, '//Details')}"
      end
    end

    def default_timeout
      DEFAULT_TIMEOUT
    end

    def polling_sleep_time
      POLLING_SLEEP_TIME
    end

    def number_of_input_file_rows
      `wc -l #{input_file}`.to_i
    end

    def update_stats(response)
      @status = extract_response_field(response.body, '//Response/Status')
      @processed_rows = extract_numeric_response_field(response.body, '//Response/ProcessedCount')
      @successful_processed_rows = extract_numeric_response_field(response.body, '//Response/SuccessCount')
      # addresses that could not be matched
      @empty_processed_rows = extract_numeric_response_field(response.body, '//Response/ErrorCount')
      # invalid input that could not be processed
      @failed_processed_rows = extract_numeric_response_field(response.body, '//Response/InvalidCount')
      @total_rows = extract_numeric_response_field(response.body, '//Response/TotalCount')
    end

    def update_log_stats(spaced_by_time=true)
      @last_logging_time ||= Time.now
      # We don't want to log every few seconds because this kind
      # of jobs could last for hours
      if (not spaced_by_time) || (Time.now - @last_logging_time) > LOGGING_TIME
        @log.append_and_store "Geocoding job status update. "\
          "Status: #{@status} --- Processed rows: #{@processed_rows} "\
          "--- Success: #{@successful_processed_rows} --- Empty: #{@empty_processed_rows} "\
          "--- Failed: #{@failed_processed_rows}"
        @last_logging_time = Time.now
      end
    end

    def timeout?
      (Time.now - @started_at) > default_timeout
    end
  end
end

# encoding: utf-8
require 'open3'
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
    DOWNLOAD_RETRIES = 5
    DOWLOAD_RETRY_SLEEP = 5.seconds

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


    def initialize(input_csv_file, working_dir, log, geocoding_model)
      @input_file = input_csv_file
      @dir = working_dir
      @log = log
      @geocoding_model = geocoding_model
      @base_url = config.fetch('base_url')
      @app_id = config.fetch('app_id')
      @token = config.fetch('token')
      @mailto = config.fetch('mailto')
      @used_batch_request = true
      begin
        @batch_api_disabled = config['batch_api_disabled'] == true
      rescue
        @batch_api_disabled = false
      end
    end

    def run
      init_rows_count
      @log.append_and_store "Started batched Here geocoding job"
      @started_at = Time.now
      change_status('running')
      upload

      # INFO: this loop polls for the state of the table_geocoder batch process
      update_status
      until ['completed', 'cancelled'].include? @geocoding_model.state do
        if timeout?
          begin
            change_status('timeout')
            cancel
          ensure
            @log.append_and_store "Proceding to cancel job due timeout"
          end
        end

        break if ['failed', 'timeout'].include? @geocoding_model.state

        sleep polling_sleep_time
        # We don't want to change the status if the job has been cancelled by the user
        update_status
        update_log_stats
      end
      update_status
      update_log_stats
      change_status('completed')
      @log.append_and_store "Geocoding Hires job has finished"
    ensure
      # Processed data at the end of the job
      update_status
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
      # Update geocodings model with needed data
      @geocoding_model.remote_id = @request_id
      @geocoding_model.batched = true
      @geocoding_model.save
      @log.append_and_store "Job sent to HERE, job id: #{@request_id}"

      @request_id
    end

    def used_batch_request?
      @used_batch_request
    end

    def cancel
      if @geocoding_model.remote_id.nil?
        @log.append_and_store "Can't cancel a HERE geocoder job without the request id"
      else
        @log.append_and_store "Trying to cancel a batch job sent to HERE"
        assert_batch_api_enabled
        response = http_client.put(api_url(action: 'cancel'),
                                   connecttimeout: HTTP_CONNECTION_TIMEOUT,
                                   timeout: HTTP_REQUEST_TIMEOUT)
        if is_cancellable?(response)
          @log.append_and_store "Job was already cancelled"
        else
          handle_api_error(response)
          update_stats(response)
          @log.append_and_store "Job sent to HERE has been cancelled"
        end
        change_status('cancelled')
      end
    end

    def update_status
      assert_batch_api_enabled
      response = http_client.get(api_url(action: 'status'),
                                 connecttimeout: HTTP_CONNECTION_TIMEOUT,
                                 timeout: HTTP_REQUEST_TIMEOUT)
      handle_api_error(response)
      update_stats(response)
    end

    def assert_batch_api_enabled
      raise ServiceDisabled if @batch_api_disabled
    end

    def result
      return @result unless @result.nil?

      raise 'No request_id provided' unless @geocoding_model.remote_id
      results_filename = File.join(dir, "#{@geocoding_model.remote_id}.zip")
      download_url = api_url({}, 'result')
      download_status_code = nil
      retries = 0
      while true
        if(!download_status_code.nil? && download_status_code == 200)
          break
        elsif !download_status_code.nil? && download_status_code == 404
          # 404 means that the results file is not ready yet
          sleep DOWLOAD_RETRY_SLEEP
          retries += 1
        elsif retries >= DOWNLOAD_RETRIES
          raise 'Download request failed: Too many retries, should be a problem with HERE servers'
        elsif !download_status_code.nil? && download_status_code > 200 && download_status_code != 404
          raise "Download request failed: Http status code #{download_status_code}"
        end
        download_status_code = execute_results_request(download_url, results_filename)
      end
      @result = results_filename
    end


    private

    def execute_results_request(download_url, results_filename)
        download_status_code = nil
        # generous timeout for download of results
        request = http_client.request(download_url,
                                    method: :get,
                                    timeout: 5.hours)

        File.open(results_filename, 'wb') do |download_file|
          request.on_headers do |response|
            download_status_code = response.response_code
          end

          request.on_body do |chunk|
            if download_status_code == 200
              download_file.write(chunk)
            end
          end

          request.on_complete do |response|
            download_status_code = response.response_code
          end

          request.run
        end

        return download_status_code
    end

    def config
      GeocoderConfig.instance.get
    end

    def http_client
      @http_client ||= Carto::Http::Client.get('hires_batch_geocoder',
                                               log_requests: true)
    end

    def api_url(arguments, extra_components = nil)
      arguments.merge!(app_id: app_id, token: token, mailto: mailto)
      components = [base_url]
      # We use the persisted remote_id because we don't have request_id
      # in the cancel case due is an instance variable
      components << @geocoding_model.remote_id unless @geocoding_model.remote_id.nil?
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
        message = extract_response_field(response.body, '//Details')
        @failed_processed_rows = number_of_input_file_rows if not input_file.nil?
        change_status('failed')
        raise "Geocoding API communication failure: #{message}"
      end
    end

    def default_timeout
      DEFAULT_TIMEOUT
    end

    def polling_sleep_time
      POLLING_SLEEP_TIME
    end

    def number_of_input_file_rows
      stdout, _status = Open3.capture2('wc', '-l', input_file)
      stdout.to_i
    end

    def update_stats(response)
      @status = extract_response_field(response.body, '//Response/Status')
      change_status(@status)
      @processed_rows = extract_numeric_response_field(response.body, '//Response/ProcessedCount')
      @successful_processed_rows = extract_numeric_response_field(response.body, '//Response/SuccessCount')
      # addresses that could not be matched
      @empty_processed_rows = extract_numeric_response_field(response.body, '//Response/ErrorCount')
      # invalid input that could not be processed
      @failed_processed_rows = extract_numeric_response_field(response.body, '//Response/InvalidCount')
      @total_rows = extract_numeric_response_field(response.body, '//Response/TotalCount')
    end

    def init_rows_count
      @processed_rows = 0
      @successful_processed_rows = 0
      @empty_processed_rows = 0
      @failed_processed_rows = 0
      @total_rows = 0
    end

    def update_log_stats(spaced_by_time=true)
      @last_logging_time ||= Time.now
      # We don't want to log every few seconds because this kind
      # of jobs could last for hours
      if (not spaced_by_time) || (Time.now - @last_logging_time) > LOGGING_TIME
        @log.append_and_store "Geocoding job status update. "\
          "Status: #{@geocoding_model.state} --- Processed rows: #{@processed_rows} "\
          "--- Success: #{@successful_processed_rows} --- Empty: #{@empty_processed_rows} "\
          "--- Failed: #{@failed_processed_rows}"
        @last_logging_time = Time.now
      end
    end

    def timeout?
      (Time.now - @started_at) > default_timeout
    end

    def change_status(status)
      @status = status
      # The cancelled status should prevail to abort the job
      @geocoding_model.refresh
      if status != @geocoding_model.state && (not (@geocoding_model.cancelled? || @geocoding_model.timeout?))
        @geocoding_model.state = status
        @geocoding_model.save
      end
    end

    def is_cancellable?(response)
      message = extract_response_field(response.body, '//Details')
      response.response_code == 400 && message =~ /CANNOT CANCEL THE COMPLETED, DELETED, FAILED OR ALREADY CANCELLED JOB/
    end

  end
end

# encoding: utf-8
require 'csv'
require 'json'
require 'open3'
require_relative '../../../lib/carto/http/client'
require_relative 'hires_geocoder_interface'
require_relative 'geocoder_config'

module CartoDB
  class HiresGeocoder < HiresGeocoderInterface

    # Generous timeouts for this
    HTTP_CONNECTION_TIMEOUT = 60
    HTTP_REQUEST_TIMEOUT = 600

    # Default options for the regular HERE Geocoding API
    # Refer to developer.here.com for further reading
    GEOCODER_OPTIONS = {
      gen: 4,                # enables or disables backward incompatible behavior in the API
      jsonattributes: 1,     # lowercase the first character of each JSON response attribute name
      language: 'en-US',     # preferred language of address elements in the result
      maxresults: 1
    }

    attr_reader :app_id, :token, :mailto,
                :status, :processed_rows, :total_rows, :successful_processed_rows, :failed_processed_rows,
                :empty_processed_rows, :dir, :non_batch_base_url

    attr_accessor :input_file

    def initialize(input_csv_file, working_dir, log)
      @input_file = input_csv_file
      @dir = working_dir
      @log = log
      @non_batch_base_url = config.fetch('non_batch_base_url')
      @app_id = config.fetch('app_id')
      @token = config.fetch('token')
      @mailto = config.fetch('mailto')

      init_rows_count
    end

    def run
      init_rows_count
      @log.append_and_store "Initialized non batch Here geocoding job"
      @result = File.join(dir, 'generated_csv_out.txt')
      @status = 'running'
      @total_rows = input_rows
      @log.append_and_store "Total rows to be processed: #{@total_rows}"
      ::CSV.open(@result, "wb") do |output_csv_file|
        ::CSV.foreach(input_file, headers: true) do |input_row|
          process_row(input_row, output_csv_file)
        end
      end
      @status = 'completed'
      update_log_stats
      @log.append_and_store "Non-batch Here geocoding job finished"
    end

    def used_batch_request?
      false
    end

    def cancel
      # TODO implement. This needs peeking into model state
    end

    def update_status
      # TODO remove
    end

    def result
      @result
    end

    def request_id
      # INFO: there's no request_id for non-batch geocodings
      nil
    end

    private

    def config
      GeocoderConfig.instance.get
    end

    def http_client
      @http_client ||= Carto::Http::Client.get('hires_geocoder',
                                               log_requests: true,
                                               connecttimeout: HTTP_CONNECTION_TIMEOUT,
                                               timeout: HTTP_REQUEST_TIMEOUT)
    end

    def input_rows
      stdout, _stderr, _status = Open3.capture3('wc', '-l', input_file)
      stdout.to_i
    rescue
      0
    end

    def process_row(input_row, output_csv_file)
      @processed_rows += 1
      latitude, longitude = geocode_text(input_row["searchtext"])
      if !(latitude.nil? || latitude == "") && !(longitude.nil? || longitude == "")
        @successful_processed_rows += 1
        output_csv_file.add_row [input_row["searchtext"], 1, 1, latitude, longitude]
      else
        @empty_processed_rows += 1
      end
    rescue => e
      @log.append_and_store "Error processing row with search text #{input_row['searchtext']}: #{e.message}"
      CartoDB.notify_debug("Hires geocoding process row error",
                           error: e.backtrace.join('\n'), 
                           searchtext: input_row["searchtext"],
                           backtrace: e.backtrace)
      @failed_processed_rows += 1
    end

    def geocode_text(text)
      options = GEOCODER_OPTIONS.merge(searchtext: text, app_id: app_id, app_code: token)
      url = "#{non_batch_base_url}?#{URI.encode_www_form(options)}"
      http_response = http_client.get(url)
      if http_response.success?
        response = ::JSON.parse(http_response.body)["response"]
        if response['view'].empty?
          # no location info for the text input, stop here
          return [nil, nil]
        end
        position = response["view"][0]["result"][0]["location"]["displayPosition"]
        return position["latitude"], position["longitude"]
      else
        CartoDB.notify_debug('Non-batched geocoder failed request', http_response)
        return [nil, nil]
      end
    rescue NoMethodError => e
      if e.message == %Q(undefined method `[]' for nil:NilClass)
        CartoDB.notify_debug("Non-batched geocoder couldn't parse response",
          error: e.backtrace.join('\n'), backtrace: e.backtrace, text: text, response_body: http_response.body)
        [nil, nil]
      else
        raise e
      end
    end

    def api_url(arguments, extra_components = nil)
      arguments.merge!(app_id: app_id, token: token, mailto: mailto)
      components = [base_url]
      components << extra_components unless extra_components.nil?
      components << '?' + URI.encode_www_form(arguments)
      components.join('/')
    end

    def init_rows_count
      @processed_rows = 0
      @successful_processed_rows = 0
      @failed_processed_rows = 0
      @empty_processed_rows = 0
    end

    def update_log_stats
      @log.append_and_store "Geocoding non-batch Here job status update. "\
        "Status: #{@status} --- Processed rows: #{@processed_rows} "\
        "--- Success: #{@successful_processed_rows} --- Empty: #{@empty_processed_rows} "\
        "--- Failed: #{@failed_processed_rows}"
    end
  end
end

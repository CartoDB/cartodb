# encoding: utf-8
require 'nokogiri'
require 'csv'
require 'json'
require 'open3'
require 'uuidtools'
require_relative '../../../lib/carto/http/client'

module CartoDB
  class Geocoder
    BATCH_FILES_OVER = 1100 # Use Here Batch Geocoder API with tables over x rows
    
    # Options for the csv upload endpoint of the Batch Geocoder API
    UPLOAD_OPTIONS = {
      action: 'run',
      indelim: ',',
      outdelim: ',',
      header: false,
      outputCombined: false,
      outcols: "displayLatitude,displayLongitude"
    }

    # Default options for the regular HERE Geocoding API
    # Refer to developer.here.com for further reading
    GEOCODER_OPTIONS = { 
      gen: 4,                # enables or disables backward incompatible behavior in the API
      jsonattributes: 1,     # lowercase the first character of each JSON response attribute name
      language: 'en-US',     # preferred language of address elements in the result
      maxresults: 1
    }

    attr_reader   :base_url, :request_id, :app_id, :token, :mailto,
                  :status, :processed_rows, :total_rows, :dir,
                  :non_batch_base_url

    attr_accessor :input_file

    class ServiceDisabled < StandardError; end

    def initialize(arguments)
      @input_file         = arguments[:input_file]
      @base_url           = arguments[:base_url]
      @non_batch_base_url = arguments[:non_batch_base_url]
      @request_id         = arguments[:request_id]
      @app_id             = arguments.fetch(:app_id)
      @token              = arguments.fetch(:token)
      @mailto             = arguments.fetch(:mailto)
      @force_batch        = arguments[:force_batch] || false
      @dir                = arguments[:dir] || Dir.mktmpdir
      @used_batch_request = false
      begin
        @batch_api_disabled = Cartodb.config[:geocoder]['batch_api_disabled'] == true
      rescue
        @batch_api_disabled = false
      end
    end # initialize

    def use_batch_process?
      @force_batch || input_rows > BATCH_FILES_OVER
    end

    def input_rows
      stdout, stderr, status  = Open3.capture3('wc', '-l', input_file)
      stdout.to_i
    rescue => e
      0
    end

    def upload
      return run_non_batched unless use_batch_process?
      assert_batch_api_enabled
      @used_batch_request = true
      response = http_client.post(
        api_url(UPLOAD_OPTIONS),
        body: File.open(input_file,"r").read,
        headers: { "Content-Type" => "text/plain" }
      )
      handle_api_error(response)
      @request_id = extract_response_field(response.body)
    end

    def used_batch_request?
      @used_batch_request
    end

    def cancel
      return unless use_batch_process?
      assert_batch_api_enabled
      response = http_client.put api_url(action: 'cancel')
      handle_api_error(response)
      @status         = extract_response_field(response.body, '//Response/Status')
      @processed_rows = extract_response_field(response.body, '//Response/ProcessedCount')
      @total_rows     = extract_response_field(response.body, '//Response/TotalCount')
    end # cancel

    def delete
      return unless use_batch_process?
      assert_batch_api_enabled
      response = http_client.delete api_url({})
      handle_api_error(response)
      @status         = extract_response_field(response.body, '//Response/Status')
      @processed_rows = extract_response_field(response.body, '//Response/ProcessedCount')
      @total_rows     = extract_response_field(response.body, '//Response/TotalCount')
    end # cancel

    def update_status
      return unless use_batch_process?
      assert_batch_api_enabled
      response = http_client.get api_url(action: 'status')
      handle_api_error(response)
      @status         = extract_response_field(response.body, '//Response/Status')
      @processed_rows = extract_response_field(response.body, '//Response/ProcessedCount')
      @total_rows     = extract_response_field(response.body, '//Response/TotalCount')
    end # update_status

    def assert_batch_api_enabled
      raise ServiceDisabled if @batch_api_disabled
    end

    def result
      return @result unless @result.nil?
      results_filename = File.join(dir, "#{request_id}.zip")
      stdout, stderr, status  = Open3.capture3('wget', '-nv', '-E', '-O', results_filename, api_url({}, 'result'))
      @result = Dir[File.join(dir, '*')][0]
    end # results

    def run_non_batched
      @result = File.join(dir, 'generated_csv_out.txt')
      @status = 'running'
      @total_rows = input_rows
      @processed_rows = 0
      csv = ::CSV.open(@result, "wb")
      ::CSV.foreach(input_file, headers: true) do |row|
        @processed_rows = @processed_rows + 1
        latitude, longitude = geocode_text(row["searchtext"])
        next if latitude == "" || latitude == nil
        csv << [row["searchtext"], 1, 1, latitude, longitude]
      end
      csv.close
      @status = 'completed'
      @request_id = UUIDTools::UUID.timestamp_create.to_s.gsub('-', '')
    end

    def geocode_text(text)
      options = GEOCODER_OPTIONS.merge(searchtext: text, app_id: app_id, app_code: token)
      url = "#{non_batch_base_url}?#{URI.encode_www_form(options)}"
      response =  ::JSON.parse(http_client.get(url).body.to_s)["response"]
      position = response["view"][0]["result"][0]["location"]["displayPosition"]
      return position["latitude"], position["longitude"]
    rescue => e
      Rollbar.report_exception(e)
      [nil, nil]
    end

    def api_url(arguments, extra_components = nil)
      arguments.merge!(app_id: app_id, token: token, mailto: mailto)
      components = [base_url]
      components << request_id unless request_id.nil?
      components << extra_components unless extra_components.nil?
      components << '?' + URI.encode_www_form(arguments)
      components.join('/')
    end # api_url

    def extract_response_field(response, query = '//Response/MetaInfo/RequestId')
      Nokogiri::XML(response).xpath("#{query}").first.content
    rescue NoMethodError => e
      nil
    end # extract_response_field

    def handle_api_error(response)
      raise "Geocoding API communication failure: #{extract_response_field(response.body, '//Details')}" if response.code != 200
    end # handle_api_errpr


    private

    def http_client
      @http_client ||= Carto::HttpClient.get('geocoder', log_requests: true)
    end

  end # Geocoder
end # CartoDB

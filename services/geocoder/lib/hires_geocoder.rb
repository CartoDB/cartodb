# encoding: utf-8
require 'csv'
require 'json'
require 'open3'
require_relative '../../../lib/carto/http/client'
require_relative 'hires_geocoder_interface'

module CartoDB
  class HiresGeocoder < HiresGeocoderInterface

    # Default options for the regular HERE Geocoding API
    # Refer to developer.here.com for further reading
    GEOCODER_OPTIONS = {
      gen: 4,                # enables or disables backward incompatible behavior in the API
      jsonattributes: 1,     # lowercase the first character of each JSON response attribute name
      language: 'en-US',     # preferred language of address elements in the result
      maxresults: 1
    }

    attr_reader   :app_id, :token, :mailto,
                  :status, :processed_rows, :total_rows, :dir,
                  :non_batch_base_url

    attr_accessor :input_file


    def initialize(input_csv_file, working_dir)
      @input_file         = input_csv_file
      @dir                = working_dir

      @non_batch_base_url = config.fetch('non_batch_base_url')
      @app_id             = config.fetch('app_id')
      @token              = config.fetch('token')
      @mailto             = config.fetch('mailto')
    end

    def run
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
      Cartodb.config[:geocoder]
    end

    def http_client
      @http_client ||= Carto::Http::Client.get('hires_geocoder', log_requests: true)
    end

    def input_rows
      stdout, stderr, status  = Open3.capture3('wc', '-l', input_file)
      stdout.to_i
    rescue => e
      0
    end

    def geocode_text(text)
      options = GEOCODER_OPTIONS.merge(searchtext: text, app_id: app_id, app_code: token)
      url = "#{non_batch_base_url}?#{URI.encode_www_form(options)}"
      http_response = http_client.get(url)
      if http_response.success?
        response =  ::JSON.parse(http_response.body)["response"]
        position = response["view"][0]["result"][0]["location"]["displayPosition"]
        return position["latitude"], position["longitude"]
      else
        CartoDB.notify_debug('Non-batched geocoder failed request', http_response)
        return [nil, nil]
      end
    rescue => e
      CartoDB.notify_exception(e)
      [nil, nil]
    end

    def api_url(arguments, extra_components = nil)
      arguments.merge!(app_id: app_id, token: token, mailto: mailto)
      components = [base_url]
      components << extra_components unless extra_components.nil?
      components << '?' + URI.encode_www_form(arguments)
      components.join('/')
    end # api_url

  end # Geocoder
end # CartoDB

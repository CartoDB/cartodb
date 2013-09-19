# encoding: utf-8
require 'typhoeus'
require 'nokogiri'

module CartoDB
  class Geocoder
    UPLOAD_OPTIONS = {
      action: 'run',
      indelim: ',',
      outdelim: ',',
      header: false,
      outputCombined: false,
      outcols: "displayLatitude,displayLongitude"
    }

    attr_reader   :base_url, :request_id, :app_id, :token, :mailto,
                  :status, :processed_rows, :total_rows, :dir

    attr_accessor :input_file

    def initialize(arguments)
      @input_file = arguments[:input_file]
      @base_url   = "http://batch.geo.st.nlp.nokia.com/search-batch/6.2/jobs"
      @request_id = arguments[:request_id]
      @app_id     = arguments.fetch(:app_id)
      @token      = arguments.fetch(:token)
      @mailto     = arguments.fetch(:mailto)
      @dir        = arguments[:dir] || Dir.mktmpdir
    end # initialize

    def upload
      response = Typhoeus.post(
        api_url(UPLOAD_OPTIONS),
        body: File.open(input_file,"r").read,
        headers: { "Content-Type" => "text/plain" }
      )
      handle_api_error(response)
      @request_id = extract_response_field(response.body)
    end # upload

    def update_status
      response = Typhoeus.get api_url(action: 'status')
      handle_api_error(response)
      @status         = extract_response_field(response.body, '//Response/Status')
      @processed_rows = extract_response_field(response.body, '//Response/ProcessedCount')
      @total_rows     = extract_response_field(response.body, '//Response/TotalCount')
    end # update_status

    def result
      return @result unless @result.nil?
      results_filename = File.join(dir, "#{request_id}.zip")
      system('wget', '-nv', '-E', '-O', results_filename, api_url({}, 'result'))
      @result = Dir[File.join(dir, '*')][0]
    end # results

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
      if response.code != 200
        raise "#{extract_response_field(response.body, '//Details')}"
      end
    end # handle_api_errpr

  end # Geocoder
end # CartoDB

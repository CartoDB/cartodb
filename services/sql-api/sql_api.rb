# encoding: utf-8
require 'open-uri'
require 'json'
require_relative '../../lib/carto/http_client'

module CartoDB
  class SQLApi
    class SQLError        < StandardError; end
    class PermissionError < StandardError; end

    # seconds
    CONNECT_TIMEOUT = 45
    DEFAULT_TIMEOUT = 60

    attr_accessor :api_key, :username, :protocol, :timeout
    attr_reader   :response_code, :parsed_response

    def initialize(arguments)
      self.username = arguments.fetch(:username)
      self.api_key  = arguments.fetch(:api_key, nil)
      self.protocol = arguments.fetch(:protocol, 'http')
      self.timeout  = arguments.fetch(:timeout, DEFAULT_TIMEOUT)
    end

    def fetch(query, format = '')
      params   = { q: query, api_key: api_key, format: format }
      response = http_client.request(
        base_url,
        method: :post,
        body: URI.encode_www_form(params),
        headers: { 'Accept-Encoding' => 'gzip,deflate' },
        connecttimeout: CONNECT_TIMEOUT,
        timeout: timeout
      ).run
      handle_response(response)
    end

    def handle_response(response)
      @response_code    = response.response_code
      body              = inflate(response.body.to_s)
      @parsed_response  = ::JSON.parse(body) rescue nil
      raise_if_error
      parsed_response["rows"] rescue body
    end

    def inflate(text)
      Zlib::GzipReader.new(StringIO.new(text)).read
    rescue Zlib::GzipFile::Error
      return text
    end

    def raise_if_error
      error_message   = parsed_response["error"].first rescue nil
      raise PermissionError if error_message =~ /^permission denied for relation/
      raise SQLError.new(error_message) if response_code != 200
    end

    def base_url
      "#{protocol}://#{username}.cartodb.com/api/v2/sql"
    end


    private

    def http_client
      @http_client ||= Carto::HttpClient.get('sql_api')
    end

  end
end

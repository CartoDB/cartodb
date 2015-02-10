# encoding: utf-8
require 'typhoeus'
require 'open-uri'
require 'json'

module CartoDB
  class SQLApi
    class SQLError        < StandardError; end
    class PermissionError < StandardError; end

    attr_accessor :api_key, :username
    attr_reader   :response_code, :response_body, :parsed_response

    def initialize(arguments)
      self.username   = arguments.fetch(:username)
      self.api_key    = arguments.fetch(:api_key, nil)
    end # initialize


    def fetch(query, format = '')
      response = Typhoeus::Request.new(
        base_url,
        method: :get,
        params: { api_key: api_key, format: format, q: query },
        headers: { 'Accept-Encoding' => 'gzip,deflate' }
      ).run
      handle_response(response)
    end

    def handle_response(response)
      @response_code    = response.response_code
      body              = inflate(response.body.to_s)
      @parsed_response  = ::JSON.parse(body) rescue nil
      raise_if_error
      parsed_response["rows"] rescue body
    end # handle_response

    def inflate(text)
      Zlib::GzipReader.new(StringIO.new(text)).read
    rescue Zlib::GzipFile::Error
      return text
    end # inflate

    def raise_if_error
      error_message   = parsed_response["error"].first rescue nil
      raise PermissionError if error_message =~ /^permission denied for relation/
      raise SQLError.new(error_message) if response_code != 200
    end

    def base_url
      return @base_url if @base_url.present?
      config = Cartodb.config[:sql_api].fetch('private')
      @base_url = "http://#{username}.#{config['domain']}:#{config['port']}#{config['endpoint']}"
    end

  end # SQLApi
end # CartoDB

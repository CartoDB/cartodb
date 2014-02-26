# encoding: utf-8
require 'typhoeus'
require 'open-uri'
require 'json'

module CartoDB
  class SQLApi
    class SQLError        < StandardError; end
    class PermissionError < StandardError; end

    attr_accessor :api_key, :username
    attr_reader   :response_code, :raw_response, :parsed_response

    def initialize(arguments)
      self.username   = arguments.fetch(:username)
      self.api_key    = arguments.fetch(:api_key, nil)
    end # initialize


    def fetch(query, format = '')
      params   = { q: query, api_key: api_key, format: format }
      response = Typhoeus.post(
        base_url,
        body: URI.encode_www_form(params)
      )
      handle_response(response)
    end # fetch

    def handle_response(response)
      @response_code   = response.response_code
      @raw_response    = response.body
      @parsed_response =  ::JSON.parse(response.body.to_s)
      raise_if_error
      parsed_response["rows"]
    end

    def raise_if_error
      error_message = parsed_response["error"].first rescue nil
      raise PermissionError if error_message =~ /^permission denied for relation/
      raise SQLError.new(error_message) if response_code != 200
    end

    def base_url
      "http://#{username}.cartodb.com/api/v2/sql"
    end # base_url

  end # SQLApi
end # CartoDB

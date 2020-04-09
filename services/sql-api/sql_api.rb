require 'open-uri'
require 'json'
require_relative '../../lib/carto/http/client'

module CartoDB
  class SQLApi

    class SQLApiError < StandardError; end
    class SQLError < SQLApiError; end
    class PermissionError < SQLApiError; end
    class TimeoutError < SQLApiError; end
    class DnsError < SQLApiError; end

    # seconds
    CONNECT_TIMEOUT = 45
    DEFAULT_TIMEOUT = 60

    attr_accessor :api_key, :username, :timeout, :base_url
    attr_reader   :response_code, :parsed_response

    # privacy: 'public' / 'private'
    def self.with_username_api_key(username, api_key, privacy,
                                   base_url: ::ApplicationHelper.sql_api_url(username, privacy))
      new(
        base_url: base_url,
        username: username,
        api_key: api_key
      )
    end

    def self.with_user(user, privacy)
      with_username_api_key(user.username, user.api_key, privacy)
    end

    def initialize(arguments)
      self.username = arguments.fetch(:username)
      self.api_key  = arguments.fetch(:api_key, nil)
      self.timeout  = arguments.fetch(:timeout, DEFAULT_TIMEOUT)
      self.base_url = arguments.fetch(:base_url, nil)
    end

    def url(query, format = '', filename = '')
      build_request(query, format, filename, :get, :public).url
    end

    def export_table_url(table, format = 'gpkg', filename = table)
      query = %{select * from "#{table}"}
      url(query, format, filename)
    end

    def fetch(query, format = '')
      request = build_request(query, format)
      response = request.run
      handle_response(response)
    end

    def handle_response(response)
      @response_code    = response.response_code
      body              = inflate(response.body.to_s)
      @parsed_response  = ::JSON.parse(body) rescue nil
      raise_if_error(response)
      parsed_response["rows"] rescue body
    end

    def inflate(text)
      Zlib::GzipReader.new(StringIO.new(text)).read
    rescue Zlib::GzipFile::Error
      return text
    end

    def raise_if_error(response)
      error_message   = parsed_response["error"].first rescue nil
      raise DnsError if response.return_code == :couldnt_resolve_host
      raise TimeoutError if response.timed_out?
      raise PermissionError if error_message =~ /^permission denied for relation/
      raise SQLError.new(error_message) if response_code != 200
    end

    def build_base_url(sql_api_config_type)
      config = ::Cartodb.get_config(:sql_api, sql_api_config_type.to_s)
      if self.base_url.nil?
        %Q[#{config["protocol"]}://#{username}.#{config["domain"]}#{config["endpoint"]}]
      else
        %Q[#{self.base_url}#{config["endpoint"]}]
      end
    end

    def build_request(query, format = '', filename = '', method = :post, config_type = :private)
      params = build_params(query, format, filename)
      http_client = Carto::Http::Client.get('sql_api')
      request = http_client.request(
        build_base_url(config_type),
        method: method,
        headers: { 'Accept-Encoding' => 'gzip,deflate' },
        connecttimeout: CONNECT_TIMEOUT,
        timeout: timeout
      )
      set_request_parameters(request, method, params)
    end

    def build_params(query, format = '', filename = '')
      params = {q: query}
      params["format"] = format if !format.empty?
      params["filename"] = filename if !filename.empty?
      params["api_key"] = api_key if !api_key.nil? && !api_key.empty?
      params
    end

    def set_request_parameters(request, method, params)
      if method == :get
        request.options[:params] = URI.encode_www_form(params)
      else
        request.options[:body] = URI.encode_www_form(params)
      end
      request
    end

  end
end

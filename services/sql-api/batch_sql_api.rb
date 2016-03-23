# encoding: utf-8
require 'open-uri'
require 'json'
require_relative '../../lib/carto/http/client'

module CartoDB
  class BatchSQLApi
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

    def initialize(arguments)
      self.username = arguments.fetch(:username)
      self.api_key  = arguments.fetch(:api_key, nil)
      self.timeout  = arguments.fetch(:timeout, DEFAULT_TIMEOUT)
    end

    def execute(query)
      request = build_request(query: query)
      response = request.run
      handle_response(response)
    end

    def cancel(job_id)
      raise NotImplementedError('Cancel method is not implemented for Batch Sql API')
    end

    def update(job_id)
      raise NotImplementedError('Update method is not implemented for Batch Sql API')
    end

    def status(id)
      request = build_request(job_id: id, method: :get)
      response = request.run
      handle_response(response)
    end

    def list_jobs
      request = build_request(method: :get)
      response = request.run
      handle_response(response)
    end

    private

    def handle_response(response)
      @response_code    = response.response_code
      body              = response.body.to_s
      @parsed_response  = ::JSON.parse(body) rescue nil
      raise_if_error(response)
      @parsed_response
    end

    def raise_if_error(response)
      error_message   = parsed_response["error"].first rescue nil
      raise DnsError if response.return_code == :couldnt_resolve_host
      raise TimeoutError if response.timed_out?
      raise PermissionError if error_message =~ /^permission denied for relation/
      raise SQLError.new(error_message) if response_code >= 300
    end

    def build_base_url(job_id = nil)
      config = ::Cartodb.config[:sql_api]['batch']
      base_url = %Q[#{config["protocol"]}://#{username}.#{config["domain"]}#{config["endpoint"]}]
      if !job_id.nil? && !job_id.empty?
        %Q[#{base_url}/#{job_id}]
      else
        base_url
      end
    end

    def build_request(query: nil, job_id: nil, method: :post)
      params = build_params(query)
      http_client = Carto::Http::Client.get('batch_sql_api')
      request = http_client.request(build_base_url(job_id),
                                    method: method,
                                    connecttimeout: CONNECT_TIMEOUT,
                                    timeout: timeout)
      set_request_parameters(request, method, params)
    end

    def build_params(query = nil)
      params = {}
      params["query"] = query if !query.nil? && !query.empty?
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

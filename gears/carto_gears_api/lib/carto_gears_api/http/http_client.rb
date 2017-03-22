module CartoGearsApi
  module Http
    class ConnectionError < StandardError
      def initialize(message, request:, response: nil, url: nil, body: nil, method: nil, timeout: nil)
        super(message)
        @request = request
        @response = response
        @url = url
        @body = body
        @method = method
        @timeout = timeout
      end

      def code
        @response.code
      end

      def inspect
        "#{message}; #{@method} #{@url}; #{@body}; timeout: #{@timeout} \
  request: #{@request.inspect}; response: #{@response.inspect}"
      end
    end

    class HttpResponse
      def initialize(body:)
        @body = body
      end

      def json
        JSON.parse(@body)
      end
    end

    # Preferred way for performing HTTP requests from a gear. It contains logging and useful defaults.
    class HttpClient
      def initialize(https: !development, host:, port: nil, username: nil, password: nil)
        @host = host
        @port = port
        @username = username
        @password = password

        @base_url = "http#{'s' if https}://#{@host}"
        @base_url << ":#{@port}" if @port.present?
        @auth = { username: username, password: password } if username && password
      end

      def send_request(path:, body: nil, method: :get, valid_codes: [200], timeout: nil)
        request = build_request(path: path, body: body, method: method, timeout: timeout)
        response = request.run
        if valid_codes.include?(response.code)
          HttpResponse.new(
            body: response.body
          )
        else
          raise ConnectionError.new("Unexpected response (#{response.code} - #{valid_codes})",
                                    url: request.url, body: body, method: method, timeout: timeout,
                                    request: request, response: response)
        end
      rescue => e
        CartoGearsApi::Logger.new('api').error(exception: e, additional_data: e.inspect)
        raise e
      end

      private

      def development
        !(Rails.env.production? || Rails.env.staging?)
      end

      def build_request(path:, body:, method:, content_type: { "Content-Type" => "application/json" }, timeout: 200)
        http_client = Carto::Http::Client.get(@host, log_requests: true)
        http_client.request(
          "#{@base_url}/#{path}",
          method: method,
          body: body.to_json,
          userpwd: "#{@auth[:username]}:#{@auth[:password]}",
          headers: content_type,
          ssl_verifypeer: Rails.env.production?,
          timeout: timeout,
          followlocation: true
        )
      end
    end
  end
end


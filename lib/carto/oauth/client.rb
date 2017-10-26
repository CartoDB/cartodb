module Carto
  module Oauth
    class Client
      attr_reader :state

      def initialize(auth_url:, token_url:, client_id:, client_secret:, state:, redirect_uri:, scopes:)
        @auth_url = auth_url
        @token_url = token_url
        @client_id = client_id
        @client_secret = client_secret
        @state = state
        @redirect_uri = redirect_uri
        @scopes = scopes
      end

      def authorize_url
        escaped_state = Rack::Utils.escape(@state)
        "#{@auth_url}?response_type=code&client_id=#{@client_id}&state=#{escaped_state}" \
          "&scope=#{@scopes.join(' ')}&redirect_uri=#{CGI.escape(@redirect_uri)}"
      end

      def exchange_code_for_token(code)
        body = {
          client_id: @client_id,
          client_secret: @client_secret,
          code: code,
          state: @state,
          grant_type: 'authorization_code',
          redirect_uri: @redirect_uri
        }

        response = request('POST', @token_url, body: body)
        if response && response['access_token']
          response['access_token']
        else
          CartoDB::Logger.error(message: 'Error obtaining Oauth access token', response: response)
          nil
        end
      end

      def request(method, url, body: nil, headers: {})
        headers['Accept'] = 'application/json'

        response = Typhoeus::Request.new(
          url,
          method: method,
          ssl_verifypeer: true,
          timeout: 5,
          headers: headers,
          body: body
        ).run
        JSON.parse(response.body)
      rescue StandardError => e
        CartoDB::Logger.error(message: 'Error in Oauth request', exception: e,
                              method: method, url: url, body: body, headers: headers,
                              response_code: response.code, response_headers: response.headers,
                              response_body: response.body, return_code: response.return_code)
        nil
      end
    end
  end
end

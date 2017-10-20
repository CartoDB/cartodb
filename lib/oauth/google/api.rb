require 'typhoeus'
require_dependency 'oauth/github/config'

module Carto
  module Google
    class Api
      attr_reader :access_token

      def self.with_code(config, code)
        token = config.client.exchange_code_for_token(code)
        raise 'Could not initialize Google API' unless token
        Google::Api.new(config, token)
      end

      def initialize(config, token)
        @config = config
        @access_token = token
      end

      def id
        user_data['id']
      end

      def first_name
        user_data.fetch('name', {}).fetch('givenName', nil)
      end

      def last_name
        user_data.fetch('name', {}).fetch('familyName', nil)
      end

      def email
        user_data['emails'].select { |mail| mail['type'] == 'account' }.first['value']
      end

      def user_params
        {
          username: email.split('@')[0],
          email: email,
          name: first_name,
          last_name: last_name,
          google_sign_in: true
        }
      end

      private

      def user_data
        @user_data ||= get_user_data
      rescue => e
        CartoDB::Logger.error(message: 'Error obtaining GitHub user data', exception: e, access_token: access_token)
        nil
      end

      def get_user_data
        response = Typhoeus::Request.new(
          "https://www.googleapis.com/plus/v1/people/me?access_token=#{@access_token}",
          method: 'GET',
          ssl_verifypeer: true,
          timeout: 600
        ).run

        raise 'Invalid response code' unless response.code == 200
        JSON.parse(response.body)
      rescue => e
        CartoDB::Logger.error(message: 'Error in request to Google', exception: e,
                              method: method, url: url, body: body, headers: headers,
                              response_code: response.code, response_headers: response.headers,
                              response_body: response.body, return_code: response.return_code)
        nil
      end
    end
  end
end

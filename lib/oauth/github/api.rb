require 'typhoeus'
require_dependency 'oauth/github/config'

module Carto
  module Github
    class Api
      attr_reader :access_token

      def self.with_code(config, code)
        token = exchange_code_for_token(config, code)
        raise 'Could not initialize Github API' unless token
        Github::Api.new(config, token)
      end

      def initialize(config, token)
        @config = config
        @access_token = token
      end

      def id
        user_data['id']
      end

      def username
        user_data['login']
      end

      def email
        user_emails.find { |email| email['primary'] }['email']
      end

      def student?
        response = authenticated_request('GET', 'https://education.github.com/api/user')
        if response
          response['student']
        else
          CartoDB::Logger.error(message: 'Error checking GitHub student', access_token: access_token)
          false
        end
      rescue => e
        CartoDB::Logger.error(message: 'Error checking GitHub student', exception: e, access_token: access_token)
      end

      def self.request(method, url, body: nil, headers: {})
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
      rescue => e
        CartoDB::Logger.error(message: 'Error in request to GitHub', exception: e,
                              method: method, url: url, body: body, headers: headers)
        nil
      end

      private

      def user_data
        @user_data ||= authenticated_request('GET', 'https://api.github.com/user')
      rescue => e
        CartoDB::Logger.error(message: 'Error obtaining GitHub user data', exception: e, access_token: access_token)
        nil
      end

      def user_emails
        @user_emails ||= get_emails
      end

      def get_emails
        authenticated_request('GET', 'https://api.github.com/user/emails').select { |email| email['verified'] }
      rescue => e
        CartoDB::Logger.error(message: 'Error obtaining GitHub user emails', exception: e, access_token: access_token)
        nil
      end

      def self.exchange_code_for_token(config, code)
        body = {
          client_id: config.client_id,
          client_secret: config.client_secret,
          code: code,
          state: config.state
        }
        response = request('POST', 'https://github.com/login/oauth/access_token', body: body)
        if response && response['access_token']
          response['access_token']
        else
          CartoDB::Logger.error(message: 'Error obtaining GitHub access token', response: response)
          nil
        end
      end
      private_class_method :exchange_code_for_token

      def authenticated_request(method, url, body: nil)
        self.class.request(method, url, body: body, headers: { 'Authorization' => "token #{@access_token}" })
      end
    end
  end
end

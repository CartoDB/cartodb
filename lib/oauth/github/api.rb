require 'typhoeus'
require_dependency 'oauth/github/config'

module Carto
  module Github
    class Api
      attr_reader :access_token

      def self.with_code(config, code)
        token = config.client.exchange_code_for_token(code)
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

      def name
        user_data['name']
      end

      def email
        user_emails.find { |email| email['primary'] }['email']
      end

      def student?
        response = authenticated_request('GET', 'https://education.github.com/api/user')
        if response
          response['student']
        else
          CartodbCentral::Logger.error(message: 'Error checking GitHub student', access_token: access_token)
          false
        end
      rescue => e
        CartodbCentral::Logger.error(message: 'Error checking GitHub student', exception: e, access_token: access_token)
      end

      def user_params
        {
          username: username,
          email: email,
          github_user_id: id,
          name: name
        }
      end

      private

      def user_data
        @user_data ||= authenticated_request('GET', 'https://api.github.com/user')
      rescue => e
        CartodbCentral::Logger.error(message: 'Error obtaining GitHub user data',
                                     exception: e, access_token: access_token)
        nil
      end

      def user_emails
        @user_emails ||= get_emails
      end

      def get_emails
        authenticated_request('GET', 'https://api.github.com/user/emails').select { |email| email['verified'] }
      rescue => e
        CartodbCentral::Logger.error(message: 'Error obtaining GitHub user emails', exception: e, access_token: access_token)
        nil
      end

      def authenticated_request(method, url, body: nil)
        self.class.request(method, url, body: body, headers: { 'Authorization' => "token #{@access_token}" })
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
        CartodbCentral::Logger.error(message: 'Error in request to GitHub', exception: e,
                                     method: method, url: url, body: body, headers: headers,
                                     response_code: response.code, response_headers: response.headers,
                                     response_body: response.body, return_code: response.return_code)
        nil
      end
      private_class_method :request
    end
  end
end

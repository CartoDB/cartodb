require 'typhoeus'
require_dependency 'carto/oauth/github/config'
require_dependency 'carto/oauth/api'

module Carto
  module Oauth
    module Github
      class Api < Carto::Oauth::Api
        attr_reader :access_token

        def student?
          response = authenticated_request('GET', 'https://education.github.com/api/user')
          if response
            response['student']
          else
            log_error(message: 'Error checking GitHub student', access_token: access_token)
            false
          end
        rescue StandardError => e
          log_error(message: 'Error checking GitHub student', exception: e, access_token: access_token)
        end

        def user_params
          {
            username: username,
            email: email,
            github_user_id: id,
            name: name
          }
        end

        def user
          user = User.where(github_user_id: id).first
          unless user
            user = User.where(email: email, github_user_id: nil).first
            return false unless user
            user.github_user_id = id
            user.save
          end
          user
        end

        def hidden_fields
          {
            oauth_provider: 'github',
            oauth_access_token: access_token,
            'user[github_user_id]': id
          }
        end

        def valid?(user)
          id == user.github_user_id
        end

        private

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

        def user_data
          @user_data ||= authenticated_request('GET', 'https://api.github.com/user')
        rescue StandardError => e
          log_error(message: 'Error obtaining GitHub user data', exception: e, access_token: access_token)
          nil
        end

        def user_emails
          @user_emails ||= get_emails
        end

        def get_emails
          authenticated_request('GET', 'https://api.github.com/user/emails').select { |email| email['verified'] }
        rescue StandardError => e
          log_error(message: 'Error obtaining GitHub user emails', exception: e, access_token: access_token)
          nil
        end

        def authenticated_request(method, url, body: nil)
          headers = {
            'Accept' => 'application/json',
            'Authorization' => "token #{@access_token}"
          }

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
          trace_info = {
            message: 'Error in request to GitHub', exception: e,
            request: { method: method, url: url, body: body, headers: headers }
          }
          if response
            trace_info.merge!(response: {
              code: response.code,
              headers: response.headers,
              body: response.body,
              status: response.return_code
            })
          end
          log_error(trace_info)
          nil
        end
      end
    end
  end
end

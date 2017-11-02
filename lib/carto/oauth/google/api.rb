require 'typhoeus'
require_dependency 'carto/oauth/google/config'
require_dependency 'carto/oauth/api'

module Carto
  module Oauth
    module Google
      class Api < Carto::Oauth::Api
        def student?
          false
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

        def user
          User.where(email: email).first
        end

        def hidden_fields
          {
            oauth_provider: 'google',
            oauth_access_token: access_token,
            'user[google_sign_in]': true
          }
        end

        def valid?(user)
          email == user.email
        end

        private

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

        def user_data
          @user_data ||= get_user_data
        rescue StandardError => e
          Logger.error(message: 'Error obtaining Google user data',
                       exception: e, access_token: access_token)
          nil
        end

        def get_user_data
          response = Typhoeus::Request.new(
            "https://www.googleapis.com/plus/v1/people/me?access_token=#{access_token}",
            method: 'GET',
            ssl_verifypeer: true,
            timeout: 600
          ).run

          raise 'Invalid response code' unless response.code == 200
          JSON.parse(response.body)
        rescue StandardError => e
          trace_info = {
            message: 'Error in request to Google', exception: e
          }
          if response
            trace_info.merge!(
              response_code: response.code, response_headers: response.headers,
              response_body: response.body, return_code: response.return_code
            )
          end
          Logger.error(trace_info)
          nil
        end
      end
    end
  end
end

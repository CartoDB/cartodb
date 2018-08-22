module Carto
  module OauthProvider
    class TokenPresenter
      def initialize(access_token, refresh_token: nil)
        @access_token = access_token
        @refresh_token = refresh_token
      end

      def to_hash
        base_url = CartoDB.base_url_from_user(@access_token.oauth_app_user.user)
        me_path = Rails.application.routes.url_helpers.api_v4_users_me_path

        token = {
          access_token: @access_token.api_key.token,
          token_type: 'Bearer',
          expires_in: @access_token.expires_in,
          user_info_url: base_url + me_path
        }
        token[:refresh_token] = @refresh_token.token if @refresh_token

        token
      end
    end
  end
end

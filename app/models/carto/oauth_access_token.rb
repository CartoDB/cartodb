# encoding: utf-8

require_dependency 'carto/oauth_provider/errors'

module Carto
  class OauthAccessToken < ActiveRecord::Base
    ACCESS_TOKEN_EXPIRATION_TIME = 1.hour

    belongs_to :oauth_app_user, inverse_of: :oauth_access_tokens
    belongs_to :api_key, inverse_of: :oauth_access_token, dependent: :destroy

    validates :oauth_app_user, presence: true
    validates :api_key, presence: true

    before_validation :ensure_api_key

    def expires_in
      created_at + ACCESS_TOKEN_EXPIRATION_TIME - Time.now
    end

    private

    def ensure_api_key
      self.api_key ||= oauth_app_user.user.api_keys.build_oauth_key(
        name: "oauth_authorization #{id}",
        grants: [{ type: 'apis', apis: [] }]
      )
    end
  end
end

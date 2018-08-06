# encoding: utf-8

require_dependency 'carto/oauth_provider/errors'

module Carto
  class OauthAccessToken < ActiveRecord::Base
    # Multiple of 3 for pretty base64
    CODE_RANDOM_BYTES = 12

    belongs_to :oauth_app_user, inverse_of: :oauth_access_tokens
    belongs_to :api_key, inverse_of: :oauth_access_token, dependent: :destroy

    validates :oauth_app_user, presence: true
    validates :api_key, presence: true

    before_validation :ensure_api_key

    private

    def ensure_api_key
      self.api_key ||= oauth_app_user.user.api_keys.build_oauth_key(
        name: "oauth_authorization #{id}",
        grants: [{ type: 'apis', apis: [] }]
      )
    end
  end
end

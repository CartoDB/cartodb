# encoding: utf-8

require_dependency 'carto/oauth_provider/errors'

module Carto
  class OauthAuthorization < ActiveRecord::Base
    # Multiple of 3 for pretty base64
    CODE_RANDOM_BYTES = 12

    CODE_EXPIRATION_TIME = 1.minute

    belongs_to :oauth_app_user, inverse_of: :oauth_authorization_codes

    validates :oauth_app_user, presence: true

    def self.create_with_code!(redirect_uri)
      create!(code: SecureRandom.urlsafe_base64(CODE_RANDOM_BYTES), redirect_uri: redirect_uri)
    end

    def exchange!
      ActiveRecord::Base.transaction do
        oauth_app_user.oauth_access_tokens.create!(scopes: scopes)
        destroy!
      end
    end

    private

    def expired?
      created_at < Time.now - CODE_EXPIRATION_TIME
    end
  end
end

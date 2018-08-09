# encoding: utf-8

require_dependency 'carto/oauth_provider/errors'
require_dependency 'carto/oauth_provider/scopes'

module Carto
  class OauthAuthorizationCode < ActiveRecord::Base
    include OauthProvider::Scopes
    # Multiple of 3 for pretty base64
    CODE_RANDOM_BYTES = 12

    CODE_EXPIRATION_TIME = 1.minute

    belongs_to :oauth_app_user, inverse_of: :oauth_authorization_codes

    validates :oauth_app_user, presence: true
    validates :code, presence: true
    validates :scopes, scopes: true

    before_validation :ensure_code_generated

    def exchange!
      raise OauthProvider::Errors::InvalidGrant.new if expired?

      ActiveRecord::Base.transaction do
        destroy!
        oauth_app_user.oauth_access_tokens.create!(scopes: scopes)
      end
    end

    private

    def ensure_code_generated
      self.code ||= SecureRandom.urlsafe_base64(CODE_RANDOM_BYTES)
    end

    def expired?
      created_at < Time.now - CODE_EXPIRATION_TIME
    end
  end
end

require_dependency 'carto/oauth_provider/errors'
require_dependency 'carto/oauth_provider/scopes/scopes'

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

    scope :expired, -> { where('created_at < ?', Time.now - CODE_EXPIRATION_TIME) }

    def exchange!
      raise OauthProvider::Errors::InvalidGrant.new if expired?

      ActiveRecord::Base.transaction do
        destroy!
        access_token = oauth_app_user.oauth_access_tokens.create!(scopes: scopes)
        if scopes.include?(SCOPE_OFFLINE)
          refresh_token = oauth_app_user.oauth_refresh_tokens.create!(scopes: scopes)
        end
        [access_token, refresh_token]
      end
    end

    def oauth_app
      oauth_app_user.oauth_app
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

# encoding: utf-8

require_dependency 'carto/oauth_provider/scopes'

module Carto
  class OauthRefreshToken < ActiveRecord::Base
    include OauthProvider::Scopes

    # Multiple of 3 for pretty base64
    TOKEN_RANDOM_BYTES = 15
    REFRESH_TOKEN_EXPIRATION_TIME = 6.months

    belongs_to :oauth_app_user, inverse_of: :oauth_refresh_tokens

    validates :oauth_app_user, presence: true
    validates :scopes, scopes: true
    validate  :check_offline_scope

    before_create :regenerate_token

    scope :expired, -> { where('updated_at < ?', Time.now - REFRESH_TOKEN_EXPIRATION_TIME) }

    def exchange!
      ActiveRecord::Base.transaction do
        regenerate_token
        save!
        oauth_app_user.oauth_access_tokens.create!(scopes: scopes)
      end
    end

    private

    def check_offline_scope
      errors.add(:scopes, "must contain `#{SCOPE_OFFLINE}`") unless scopes.include?(SCOPE_OFFLINE)
    end

    def regenerate_token
      self.token = SecureRandom.urlsafe_base64(TOKEN_RANDOM_BYTES)
    end
  end
end

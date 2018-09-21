# encoding: utf-8

require_dependency 'carto/oauth_provider/errors'
require_dependency 'carto/oauth_provider/scopes'

module Carto
  class OauthRefreshToken < ActiveRecord::Base
    include OauthProvider::Scopes

    # Multiple of 3 for pretty base64
    TOKEN_RANDOM_BYTES = 15
    REFRESH_TOKEN_EXPIRATION_TIME = 6.months
    MAX_TOKENS_PER_OAUTH_APP_USER = 50

    belongs_to :oauth_app_user, inverse_of: :oauth_refresh_tokens

    validates :oauth_app_user, presence: true
    validates :scopes, scopes: true
    validate  :check_offline_scope

    before_create :remove_oldest_ones
    before_create :regenerate_token

    scope :expired, -> { where('updated_at < ?', Time.now - REFRESH_TOKEN_EXPIRATION_TIME) }

    def exchange!(requested_scopes: scopes)
      raise OauthProvider::Errors::InvalidGrant.new if expired?
      invalid_scopes = requested_scopes - scopes
      raise OauthProvider::Errors::InvalidScope.new(invalid_scopes) if invalid_scopes.any?

      ActiveRecord::Base.transaction do
        regenerate_token
        save!
        [oauth_app_user.oauth_access_tokens.create!(scopes: requested_scopes), self]
      end
    end

    def oauth_app
      oauth_app_user.oauth_app
    end

    def user
      oauth_app_user.user
    end

    private

    def remove_oldest_ones
      oldest_tokens = OauthRefreshToken.where(oauth_app_user: oauth_app_user)
                                       .order(updated_at: :desc)
                                       .offset(MAX_TOKENS_PER_OAUTH_APP_USER - 1)

      unless oldest_tokens.count.zero?
        CartoDB::Logger.debug(message: "Removing #{oldest_tokens.count} refresh tokens",
                              oauth_app_user: oauth_app_user)
        oldest_tokens.find_each(&:destroy!)
      end
    end

    def expired?
      updated_at < Time.now - REFRESH_TOKEN_EXPIRATION_TIME
    end

    def check_offline_scope
      errors.add(:scopes, "must contain `#{SCOPE_OFFLINE}`") unless scopes.include?(SCOPE_OFFLINE)
    end

    def regenerate_token
      self.token = SecureRandom.urlsafe_base64(TOKEN_RANDOM_BYTES)
    end
  end
end

require_dependency 'carto/oauth_provider/errors'
require_dependency 'carto/oauth_provider/scopes/scopes'

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

    before_create :remove_oldest_ones, unless: :skip_token_regeneration
    before_create :regenerate_token, unless: :skip_token_regeneration

    scope :expired, -> { where('updated_at < ?', Time.now - REFRESH_TOKEN_EXPIRATION_TIME) }

    attr_accessor :skip_token_regeneration

    def exchange!(requested_scopes: scopes)
      raise OauthProvider::Errors::InvalidGrant.new if expired?
      invalid_scopes = Carto::OauthProvider::Scopes.subtract_scopes(requested_scopes, scopes, oauth_app_user.user.database_schema)
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

    private

    def remove_oldest_ones
      oldest_tokens = OauthRefreshToken.where(oauth_app_user: oauth_app_user)
                                       .order(updated_at: :desc)
                                       .offset(MAX_TOKENS_PER_OAUTH_APP_USER - 1)

      oldest_tokens.find_each(&:destroy!) unless oldest_tokens.count.zero?
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

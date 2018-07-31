# encoding: utf-8

require_dependency 'carto/oauth_provider/errors'

module Carto
  class OauthAuthorization < ActiveRecord::Base
    # Multiple of 3 for pretty base64
    CODE_RANDOM_BYTES = 12

    CODE_EXPIRATION_TIME = 1.minute

    belongs_to :oauth_app_user, inverse_of: :oauth_authorizations
    belongs_to :api_key, inverse_of: :oauth_authorization

    validates :oauth_app_user, presence: true
    validate :code_or_api_key_present

    def self.create_with_code!(redirect_uri)
      create!(code: SecureRandom.urlsafe_base64(CODE_RANDOM_BYTES), redirect_uri: redirect_uri)
    end

    def exchange!
      raise OauthProvider::Errors::InvalidGrant.new if expired?

      self.code = nil
      self.api_key = build_api_key
      save!
    end

    private

    def build_api_key
      oauth_app_user.user.api_keys.build_internal_key(
        name: "oauth_authorization #{id}",
        grants: [{ type: 'apis', apis: [] }]
      )
    end

    def expired?
      created_at < Time.now - CODE_EXPIRATION_TIME
    end

    def code_or_api_key_present
      # You can have either code if the token is not exchanged yet, or an api_key
      errors.add(:api_key, 'must be present if code is missing') if code.blank? && api_key.blank?
    end
  end
end

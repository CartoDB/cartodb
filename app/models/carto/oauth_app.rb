# encoding: utf-8

module Carto
  class OauthApp < ActiveRecord::Base
    # Multiple of 3 for pretty base64
    CLIENT_ID_RANDOM_BYTES = 9
    CLIENT_SECRET_RANDOM_BYTES = 18

    belongs_to :user, inverse_of: :oauth_apps
    has_many :oauth_app_users, inverse_of: :oauth_app, dependent: :destroy

    validates :user, presence: true
    validates :name, presence: true
    validates :client_id, presence: true
    validates :client_secret, presence: true
    validates :redirect_uri, presence: true
    validate :validate_uri

    before_validation :ensure_keys_generated

    private

    def ensure_keys_generated
      self.client_id ||= SecureRandom.urlsafe_base64(CLIENT_ID_RANDOM_BYTES)
      self.client_secret ||= SecureRandom.urlsafe_base64(CLIENT_SECRET_RANDOM_BYTES)
    end

    def validate_uri
      uri = URI.parse(redirect_uri)
      errors.add(:redirect_uri, "must be absolute") unless uri.absolute?
      errors.add(:redirect_uri, "must be https") unless uri.scheme == 'https'
      errors.add(:redirect_uri, "must not contain a fragment") unless uri.fragment.nil?
    rescue URI::InvalidURIError
      errors.add(:redirect_uri, "must be valid")
    end
  end
end

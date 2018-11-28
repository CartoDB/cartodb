# encoding: utf-8

module Carto
  class OauthApp < ActiveRecord::Base
    # Multiple of 3 for pretty base64
    CLIENT_ID_RANDOM_BYTES = 9
    CLIENT_SECRET_RANDOM_BYTES = 18

    belongs_to :user, inverse_of: :oauth_apps
    has_many :oauth_app_users, inverse_of: :oauth_app, dependent: :destroy
    has_many :oauth_app_organizations, inverse_of: :oauth_app, dependent: :destroy

    validates :user, presence: true
    validates :name, presence: true
    validates :client_id, presence: true
    validates :client_secret, presence: true
    validates :redirect_uris, presence: true
    validates :icon_url, presence: true
    validates :oauth_app_organizations, absence: true, unless: :restricted?
    validate :validate_uris

    before_validation :ensure_keys_generated

    before_save :sync_with_central, if: :sync_with_central?
    before_destroy :delete_from_central, if: :sync_with_central?

    ALLOWED_SYNC_ATTRIBUTES = ['name', 'client_id', 'client_secret', 'redirect_uris', 'icon_url', 'restricted'].freeze

    private

    def ensure_keys_generated
      self.client_id ||= SecureRandom.urlsafe_base64(CLIENT_ID_RANDOM_BYTES)
      self.client_secret ||= SecureRandom.urlsafe_base64(CLIENT_SECRET_RANDOM_BYTES)
    end

    def validate_uris
      redirect_uris && redirect_uris.each { |uri| validate_uri(uri) }
    end

    def validate_uri(redirect_uri)
      uri = URI.parse(redirect_uri)
      errors.add(:redirect_uris, "must be absolute") unless uri.absolute?
      errors.add(:redirect_uris, "must be https") unless uri.scheme == 'https'
      errors.add(:redirect_uris, "must not contain a fragment") unless uri.fragment.nil?
    rescue URI::InvalidURIError
      errors.add(:redirect_uris, "must be valid")
    end

    def sync_with_central
      if persisted?
        cartodb_central_client.update_oauth_app(user.username, id, attributes_changed)
      else
        cartodb_central_client.create_oauth_app(user.username, sync_attributes)
      end
    end

    def delete_from_central
      cartodb_central_client.delete_oauth_app(user.username, id)
    end

    def cartodb_central_client
      @cartodb_central_client ||= Cartodb::Central.new
    end

    def sync_with_central?
      Cartodb::Central.sync_data_with_cartodb_central?
    end

    def attributes_changed(attrs = sync_attributes)
      attrs.select { |x| changes.keys.include?(x.to_s) }
    end

    def sync_attributes
      attributes.select { |x| ALLOWED_SYNC_ATTRIBUTES.include?(x.to_s) }
    end
  end
end

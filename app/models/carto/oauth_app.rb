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

    after_save :sync_with_central, if: :sync_with_central?
    after_destroy :delete_from_central, if: :sync_with_central?

    ALLOWED_SYNC_ATTRIBUTES = %i[id name client_id client_secret redirect_uris icon_url restricted].freeze
    ALLOWED_SYNC_PARAMS = ALLOWED_SYNC_ATTRIBUTES + [:user_id, redirect_uris: []].freeze

    attr_writer :avoid_sync_central

    def avoid_sync_central
      @avoid_sync_central || false
    end

    # this should be exactly the same method as in Central
    # mostly used for testing the Superadmin API
    def api_attributes
      attributes.symbolize_keys.slice(*ALLOWED_SYNC_ATTRIBUTES).merge(user_id: user.id)
    end

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
      if id_changed?
        cartodb_central_client.create_oauth_app(user.username, sync_attributes)
      else
        cartodb_central_client.update_oauth_app(user.username, id, attributes_changed)
      end
    end

    def delete_from_central
      cartodb_central_client.delete_oauth_app(user.username, id)
    end

    def cartodb_central_client
      @cartodb_central_client ||= Cartodb::Central.new
    end

    def sync_with_central?
      Cartodb::Central.sync_data_with_cartodb_central? && !avoid_sync_central
    end

    def attributes_changed
      changed_attrs = attributes.symbolize_keys.slice(*changes.symbolize_keys.keys)
      sync_attributes(changed_attrs)
    end

    def sync_attributes(attrs = attributes)
      attrs.symbolize_keys.slice(*ALLOWED_SYNC_ATTRIBUTES)
    end
  end
end

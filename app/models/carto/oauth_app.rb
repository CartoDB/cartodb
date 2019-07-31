# encoding: utf-8

require_dependency 'carto/helpers/url_validator'

module Carto
  class OauthApp < ActiveRecord::Base
    # Multiple of 3 for pretty base64
    CLIENT_ID_RANDOM_BYTES = 9
    CLIENT_SECRET_RANDOM_BYTES = 18

    belongs_to :user, inverse_of: :oauth_apps
    has_many :oauth_app_users, inverse_of: :oauth_app, dependent: :destroy
    has_many :oauth_app_organizations, inverse_of: :oauth_app, dependent: :destroy

    validates :user, presence: true, if: -> { sync_with_central? || !central_enabled? }
    validates :name, presence: true
    validates :website_url, presence: true, url: true
    validates :client_id, presence: true
    validates :client_secret, presence: true
    validates :redirect_uris, presence: true
    validates :icon_url, presence: true, url: true
    validates :oauth_app_organizations, absence: true, unless: :restricted?
    validate :validate_uris

    before_validation :ensure_keys_generated

    after_create :create_central, if: :sync_with_central?
    after_update :update_central, if: :sync_with_central?
    after_destroy :delete_central, if: :sync_with_central?

    ALLOWED_SYNC_ATTRIBUTES = %i[id name client_id client_secret redirect_uris
      icon_url restricted description website_url].freeze

    attr_accessor :avoid_sync_central

    # this should be exactly the same method as in Central
    # mostly used for testing the Superadmin API
    def api_attributes
      attributes.symbolize_keys.slice(*ALLOWED_SYNC_ATTRIBUTES).merge(user_id: user.id)
    end

    def regenerate_client_secret!
      self.client_secret = SecureRandom.urlsafe_base64(CLIENT_SECRET_RANDOM_BYTES)
      save!
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

    def create_central
      cartodb_central_client.create_oauth_app(user.username, sync_attributes)
    end

    def update_central
      cartodb_central_client.update_oauth_app(user.username, id, sync_attributes)
    end

    def delete_central
      cartodb_central_client.delete_oauth_app(user.username, id)
    end

    def cartodb_central_client
      @cartodb_central_client ||= Cartodb::Central.new
    end

    def sync_with_central?
      central_enabled? && !avoid_sync_central
    end

    def central_enabled?
      Cartodb::Central.sync_data_with_cartodb_central?
    end

    def sync_attributes(attrs = attributes)
      attrs.symbolize_keys.slice(*ALLOWED_SYNC_ATTRIBUTES)
    end
  end
end

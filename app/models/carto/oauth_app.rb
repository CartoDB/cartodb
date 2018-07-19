# encoding: utf-8

module Carto
  class OauthApp < ActiveRecord::Base
    belongs_to :user, inverse_of: :oauth_apps

    validates :user, presence: true
    validates :name, presence: true
    validates :client_id, presence: true
    validates :client_secret, presence: true
    validates :redirect_urls, presence: true
    validate :validate_urls

    before_validation :generate_keys

    private

    def generate_keys
      self.client_id ||= SecureRandom.urlsafe_base64(9)
      self.client_secret ||= SecureRandom.urlsafe_base64(18)
    end

    def validate_urls
      redirect_urls.each { |url| validate_url(url) }
    end

    def validate_url(url)
      uri = URI.parse(url)
      return errors.add(:callback_urls, "#{url} must be absolute") unless uri.absolute?
      return errors.add(:callback_urls, "#{url} must be https") unless uri.scheme == 'https'
    rescue
      errors.add(:callback_urls, "#{url} must be valid")
    end
  end
end

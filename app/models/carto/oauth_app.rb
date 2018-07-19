# encoding: utf-8

module Carto
  class OauthApp < ActiveRecord::Base
    belongs_to :user, inverse_of: :oauth_apps

    validates :user, presence: true
    validates :name, presence: true
    validates :client_id, presence: true
    validates :client_secret, presence: true
    validates :callback_urls, presence: true

    before_validation :generate_keys

    private

    def generate_keys
      self.client_id ||= SecureRandom.urlsafe_base64(9)
      self.client_secret ||= SecureRandom.urlsafe_base64(18)
    end
  end
end

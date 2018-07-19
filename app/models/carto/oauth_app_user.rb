# encoding: utf-8

module Carto
  class OauthAppUser < ActiveRecord::Base
    self.table_name = 'oauth_apps_users'

    belongs_to :user, inverse_of: :oauth_app_users
    belongs_to :oauth_app, inverse_of: :oauth_app_users
    belongs_to :api_key, inverse_of: :oauth_app_user

    validates :user, presence: true
    validates :oauth_app, presence: true
    validate :code_or_api_key_present

    private

    def code_or_api_key_present
      errors.add(:code, 'must be present if redirect_url is') if code.blank? && redirect_url.present?
      errors.add(:redirect_url, 'must be present if code is') if code.present? && redirect_url.blank?
      errors.add(:api_key, 'must be present if code is missing') if code.blank? && api_key.blank?
    end
  end
end

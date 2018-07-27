# encoding: utf-8

module Carto
  class OauthAuthorization < ActiveRecord::Base
    belongs_to :oauth_app_user, inverse_of: :oauth_authorizations
    belongs_to :api_key, inverse_of: :oauth_authorization

    validates :oauth_app_user, presence: true
    validate :code_or_api_key_present

    private

    def code_or_api_key_present
      # You can have either code if the token is not exchanged yet, or an api_key
      errors.add(:api_key, 'must be present if code is missing') if code.blank? && api_key.blank?
    end
  end
end

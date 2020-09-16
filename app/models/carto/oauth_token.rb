require 'active_record'

module Carto
  class OauthToken < ActiveRecord::Base

    belongs_to :user, class_name: Carto::User
    belongs_to :client_application, class_name: Carto::ClientApplication

    before_create :set_token_and_secret

    def invalidated?
      invalidated_at.present?
    end

    def invalidate!
      update!(invalidated_at: Time.now)
    end

    def authorized?
      authorized_at.present? && !invalidated?
    end

    def to_query
      "oauth_token=#{token}&oauth_token_secret=#{secret}"
    end

    private

    def set_token_and_secret
      self.token = OAuth::Helper.generate_key(40)[0,40] unless token.present?
      self.secret = OAuth::Helper.generate_key(40)[0,40] unless secret.present?
    end

  end
end

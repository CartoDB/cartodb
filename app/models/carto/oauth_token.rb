require 'active_record'

module Carto
  class OauthToken < ActiveRecord::Base

    belongs_to :user, class_name: Carto::User
    belongs_to :client_application, class_name: Carto::ClientApplication

    before_create :set_token_and_secret

    # ActiveRecord inheritance compatibility after AccessToken and RequestToken were migrated from Sequel
    # Source: https://yiming.dev/blog/2017/12/07/add-sti-to-a-legacy-activerecord-model/
    def self.find_sti_class(type_name)
      super("Carto::#{type_name}")
    end

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
      self.token = OAuth::Helper.generate_key(40)[0,40] if token.blank?
      self.secret = OAuth::Helper.generate_key(40)[0,40] if secret.blank?
    end

  end
end

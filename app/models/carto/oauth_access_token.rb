require_dependency 'carto/oauth_provider/errors'
require_dependency 'carto/oauth_provider/scopes/scopes'

module Carto
  class OauthAccessToken < ActiveRecord::Base
    include OauthProvider::Scopes

    ACCESS_TOKEN_EXPIRATION_TIME = 1.hour

    belongs_to :oauth_app_user, inverse_of: :oauth_access_tokens
    belongs_to :api_key, inverse_of: :oauth_access_token, dependent: :destroy

    validates :oauth_app_user, presence: true

    validates :scopes, scopes: true

    before_create :create_api_key, unless: :skip_api_key_creation
    after_create :rename_api_key, unless: :skip_api_key_creation

    scope :expired, -> { where('created_at < ?', Time.now - ACCESS_TOKEN_EXPIRATION_TIME) }

    attr_accessor :skip_api_key_creation

    def expires_in
      created_at + ACCESS_TOKEN_EXPIRATION_TIME - Time.now
    end

    def user
      oauth_app_user.user
    end

    def ownership_role_name
      oauth_app_user.ownership_role_name
    end

    private

    def create_api_key
      grants = [{ type: 'apis', apis: [] }]
      scopes.each do |s|
        scope = OauthProvider::Scopes.build(s)
        scope.add_to_api_key_grants(grants, user)
      end

      self.api_key = oauth_app_user.user.api_keys.create_oauth_key!(
        name: "oauth_authorization #{Carto::UUIDHelper.random_uuid}",
        grants: grants,
        ownership_role_name: ownership_role_name
      )
    end

    def rename_api_key
      # Rename after creation so we have the ID
      api_key.update!(name: "oauth_authorization #{id}")
    end
  end
end

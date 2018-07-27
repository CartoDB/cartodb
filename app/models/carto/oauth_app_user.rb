# encoding: utf-8

module Carto
  class OauthAppUser < ActiveRecord::Base
    belongs_to :user, inverse_of: :oauth_app_users
    belongs_to :oauth_app, inverse_of: :oauth_app_users
    belongs_to :api_key, inverse_of: :oauth_app_user
    has_many :oauth_authorizations, inverse_of: :oauth_app_user, dependent: :destroy

    validates :user, presence: true, uniqueness: { scope: :oauth_app }
    validates :oauth_app, presence: true
  end
end

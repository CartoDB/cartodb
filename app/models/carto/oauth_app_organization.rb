# encoding: utf-8

module Carto
  class OauthAppOrganization < ActiveRecord::Base
    belongs_to :organization, inverse_of: :oauth_app_organizations
    belongs_to :oauth_app, inverse_of: :oauth_app_organizations

    validates :organization, presence: true, uniqueness: { scope: :oauth_app }
    validates :oauth_app, presence: true
    validates :seats, presence: true, numericality: { only_integer: true, greater_than: 0 }
  end
end

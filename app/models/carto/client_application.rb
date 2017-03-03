# encoding: utf-8

require 'active_record'

module Carto
  class ClientApplication < ActiveRecord::Base

    belongs_to :user, class_name: Carto::User
    has_many :oauth_tokens, class_name: Carto::OauthToken
    has_many :access_tokens, -> { where(type: ['AccessToken']) }, class_name: Carto::OauthToken

  end
end

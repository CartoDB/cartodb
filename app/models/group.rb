# coding: UTF-8

require_dependency 'carto/helpers/auth_token_generator'

class Group < Sequel::Model

  many_to_one :organization

  include Carto::AuthTokenGenerator
end

require 'active_record'
require 'oauth'
require_dependency 'cartodb_config_utils'
require_dependency 'carto/domain_patcher_request_proxy'

module Carto
  class ClientApplication < ActiveRecord::Base

    extend CartoDB::ConfigUtils

    belongs_to :user, class_name: Carto::User
    has_many :oauth_tokens, class_name: Carto::OauthToken, dependent: :destroy
    has_many :access_tokens, -> { where(type: 'AccessToken') }, class_name: Carto::OauthToken, dependent: :destroy

    before_create :initialize_entity

    def oauth_server
      # check if this is used
      @oauth_server ||= OAuth::Server.new('http://your.site')
    end

    def self.find_token(token_key)
      return nil if token_key.nil?

      token = Carto::RequestToken.find_by(token: token_key) || Carto::AccessToken.find_by(token: token_key)
      token&.authorized? ? token : nil
    end

    def self.verify_request(request, options = {}, &block)
      value = OAuth::Signature.build(request, options, &block).verify
      if !value && !cartodb_com_hosted?
        # Validation failed, try to see if it has been signed for cartodb.com
        cartodb_request = Carto::DomainPatcherRequestProxy.new(request, options)
        value = OAuth::Signature.build(cartodb_request, options, &block).verify
      end
      value
    rescue OAuth::Signature::UnknownSignatureMethod
      false
    end

    private

    def initialize_entity
      self.key = OAuth::Helper.generate_key(40)[0, 40]
      self.secret = OAuth::Helper.generate_key(40)[0, 40]
    end

  end
end

# coding: utf-8
require 'oauth'

class DomainPatcherRequestProxy < OAuth::RequestProxy::RackRequest
  def uri
    super.sub('carto.com', 'cartodb.com')
  end
end

class ClientApplication < Sequel::Model
  extend CartoDB::ConfigUtils

  one_to_many :tokens, :class_name => :OauthToken
  one_to_many :access_tokens
  one_to_many :oauth_tokens

  plugin :association_dependencies
  add_association_dependencies :oauth_tokens => :destroy

  attr_accessor :token_callback_url

  def self.find_token(token_key)
    return nil if token_key.nil?
    token = ::RequestToken.first(:token => token_key) || ::AccessToken.first(:token => token_key)
    token && token.authorized? ? token : nil
  end

  def self.find_by_key(key)
    first(:key => key)
  end

  def user
    ::User[user_id]
  end

  def user=(value)
    set(:user_id => value.id)
  end

  def self.verify_request(request, options = {}, &block)
    value = OAuth::Signature.build(request, options, &block).verify
    if !value && !cartodb_com_hosted?
      # Validation failed, try to see if it has been signed for cartodb.com
      cartodb_request = DomainPatcherRequestProxy.new(request, options)
      value = OAuth::Signature.build(cartodb_request, options, &block).verify
    end
    value
  rescue OAuth::Signature::UnknownSignatureMethod
    false
  end

  def oauth_server
    @oauth_server ||= OAuth::Server.new("http://your.site")
  end

  def credentials
    @oauth_client ||= OAuth::Consumer.new(key, secret)
  end

  # If your application requires passing in extra parameters handle it here
  def create_request_token(params={})
    RequestToken.create :client_application => self, :callback_url=>self.token_callback_url
  end

  def before_create
    self.key        = OAuth::Helper.generate_key(40)[0,40]
    self.secret     = OAuth::Helper.generate_key(40)[0,40]
    self.created_at = Time.now
  end

  def before_save
    self.updated_at = Time.now
  end
end

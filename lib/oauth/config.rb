require_dependency 'oauth/client'

module Oauth
  class Config
    attr_reader :client

    def self.api_class
      self.parent.const_get(:Api)
    end

    def self.instance(csrf, base_callback_url, invitation_token: nil, organization_name: nil)
      if config['client_id'].present?
        if Cartodb::Central.sync_data_with_cartodb_central?
          base_callback_url = Cartodb::Central.new.host + URI.parse(base_callback_url).path
        end
        new(csrf, base_callback_url, invitation_token, organization_name)
      end
    end

    def initialize(csrf, base_callback_url, invitation_token, organization_name)
      state = JSON.dump(
        csrf: csrf,
        invitation_token: invitation_token,
        organization_name: organization_name
      )

      @client = Oauth::Client.new(
        auth_url: auth_url,
        token_url: token_url,
        client_id: config['client_id'],
        client_secret: config['client_secret'],
        state: state,
        redirect_uri: base_callback_url,
        scopes: scopes
      )
    end

    def redirect_url
      client.authorize_url
    end

    def self.config
      raise 'Subclass must override config'
    end
    private_class_method :config

    private

    def config
      self.class.config
    end

    def auth_url
      raise 'Subclass must override auth_url'
    end

    def token_url
      raise 'Subclass must override token_url'
    end

    def scopes
      raise 'Subclass must override scopes'
    end

    # View-related configuration
    def button_template
      raise 'Subclass must override button_template'
    end
  end
end

# coding: UTF-8

require 'oauth/controllers/provider_controller'

class OauthController < ApplicationController
  include OAuth::Controllers::ProviderController
  
  ssl_required :authorize, :request_token, :access_token, :token, :test_request

  # 1) call request_token wiht consumer key and secret
  
  # 2) returns request token and secret
  
  # 3) call authorize (this is on twitter for example). #here we mark the request token as authorized against and account.
  
  # 4) redirects you with a url you specify.  

  # 5) call access_token with the authorized request token, HTTP cycle, returns access token and access secret.

  def access_token_with_xauth
    warden.custom_failure!
    if params[:x_auth_mode] == 'client_auth'
      if user = User.authenticate(params[:x_auth_username], params[:x_auth_password])
        @token = AccessToken.filter(:user => user, :client_application => current_client_application, :invalidated_at => nil).limit(1).first
        @token = AccessToken.create(:user => user, :client_application => current_client_application) if @token.blank?

        if @token
          render :text => @token.to_query
        else
          render_unauthorized
        end
      else
        render_unauthorized
      end
    else
      access_token_without_xauth
    end
  end
  alias_method_chain :access_token, :xauth

  protected

  def render_unauthorized
    render :nothing => true, :status => 401
  end
end

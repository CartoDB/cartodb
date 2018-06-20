require 'base64'

require_dependency 'carto/user_authenticator'
require_dependency 'carto/email_cleaner'

Rails.configuration.middleware.use RailsWarden::Manager do |manager|
  manager.default_strategies :password, :api_authentication
  manager.failure_app = SessionsController
end

# All strategies should:
# - Include this module
# - Override the methods as needed
module CartoStrategy
  def affected_by_password_expiration?
    true
  end

  def check_password_expired(user)
    if affected_by_password_expiration? && user.password_expired?
      throw(:warden, action: :password_change, username: user.username)
    end
  end

  def trigger_login_event(user)
    check_password_expired(user)
    CartoGearsApi::Events::EventManager.instance.notify(CartoGearsApi::Events::UserLoginEvent.new(user))

    # From the very beginning it's been assumed that after login you go to the dashboard, and
    # we're using that event as a synonymous to "last logged in date". Now you can skip dashboard
    # after login (see #11946), so marking that event on authentication is more accurate with the
    # meaning (although not with the name).
    user.view_dashboard
  end
end

# Setup Session Serialization
class Warden::SessionSerializer
  def serialize(user)
    user.username
  end

  def deserialize(username)
    ::User.filter(username: username).first
  end
end

Warden::Strategies.add(:password) do
  include Carto::UserAuthenticator
  include Carto::EmailCleaner
  include CartoStrategy

  def valid_password_strategy_for_user(user)
    user.organization.nil? || user.organization.auth_username_password_enabled
  end

  def authenticate!
    if params[:email] && params[:password]
      if (user = authenticate(clean_email(params[:email]), params[:password]))
        if user.enabled? && valid_password_strategy_for_user(user)
          trigger_login_event(user)

          success!(user, :message => "Success")
          request.flash['logged'] = true
        elsif !user.enable_account_token.nil?
          throw(:warden, :action => 'account_token_authentication_error', :user_id => user.id)
        else
          fail!
        end
      else
        fail!
      end
    else
      fail!
    end
  end
end

Warden::Strategies.add(:enable_account_token) do
  include CartoStrategy

  def authenticate!
    if params[:id]
      user = ::User.where(enable_account_token: params[:id]).first
      if user
        user.enable_account_token = nil
        user.save

        trigger_login_event(user)

        success!(user)
      else
        fail!
      end
    else
      fail!
    end
  end
end

Warden::Strategies.add(:oauth) do
  include CartoStrategy

  def valid_oauth_strategy_for_user(user)
    user.organization.nil? || user.organization.auth_github_enabled
  end

  def authenticate!
    fail! unless params[:oauth_api]
    oauth_api = params[:oauth_api]
    user = oauth_api.user
    if user && oauth_api.config.valid_method_for?(user)
      trigger_login_event(user)

      success!(user)
    else
      fail!
    end
  end
end

Warden::Strategies.add(:ldap) do
  include CartoStrategy

  def affected_by_password_expiration?
    false
  end

  def authenticate!
    (fail! and return) unless (params[:email] && params[:password])

    user = nil
    begin
      user = Carto::Ldap::Manager.new.authenticate(params[:email], params[:password])
    rescue Carto::Ldap::LDAPUserNotPresentAtCartoDBError => exception
      throw(:warden, action: 'ldap_user_not_at_cartodb',
        cartodb_username: exception.cartodb_username, organization_id: exception.organization_id,
        ldap_username: exception.ldap_username, ldap_email: exception.ldap_email)
    end
    # Fails, but do not stop processin other strategies (allows fallbacks)
    return unless user

    trigger_login_event(user)

    success!(user, :message => "Success")
    request.flash['logged'] = true
  end
end

Warden::Strategies.add(:api_authentication) do
  include CartoStrategy

  def affected_by_password_expiration?
    false
  end

  def authenticate!
    # WARNING: The following code is a modified copy of the oauth10_token method from
    # oauth-plugin-0.4.0.pre4/lib/oauth/controllers/application_controller_methods.rb
    # It also checks token class like does the oauth10_access_token method of that same file
    if ClientApplication.verify_request(request) do |request_proxy|
          @oauth_token = ClientApplication.find_token(request_proxy.token)
          if @oauth_token.respond_to?(:provided_oauth_verifier=)
            @oauth_token.provided_oauth_verifier=request_proxy.oauth_verifier
          end
          # return the token secret and the consumer secret
          [(@oauth_token.nil? ? nil : @oauth_token.secret), (@oauth_token.nil? || @oauth_token.client_application.nil? ? nil : @oauth_token.client_application.secret)]
        end

      if @oauth_token && @oauth_token.is_a?(::AccessToken)
        user = ::User.find_with_custom_fields(@oauth_token.user_id)
        if user.enable_account_token.nil?
          success!(user) and return
        else
          throw(:warden, :action => 'account_token_authentication_error', :user_id => user.id)
        end
      end
    end
    fail!
  end
end

Warden::Strategies.add(:http_header_authentication) do
  include CartoStrategy

  def affected_by_password_expiration?
    false
  end

  def valid?
    Carto::HttpHeaderAuthentication.new.valid?(request)
  end

  def authenticate!
    user = Carto::HttpHeaderAuthentication.new.get_user(request)
    return fail! unless user.present?

    trigger_login_event(user)

    success!(user)
  rescue => e
    CartoDB.report_exception(e, "Authenticating with http_header_authentication", user: user)
    return fail!
  end
end

Warden::Strategies.add(:saml) do
  include CartoStrategy
  include Carto::EmailCleaner

  def affected_by_password_expiration?
    false
  end

  def organization_from_request
    subdomain = CartoDB.extract_subdomain(request)
    Carto::Organization.where(name: subdomain).first if subdomain
  end

  def saml_service(organization = organization_from_request)
    Carto::SamlService.new(organization) if organization
  end

  def valid?
    params[:SAMLResponse].present? && saml_service.try(:enabled?)
  end

  def authenticate!
    organization = organization_from_request
    saml_service = Carto::SamlService.new(organization)

    email = clean_email(saml_service.get_user_email(params[:SAMLResponse]))
    user = organization.users.where(email: email).first

    if user
      if user.try(:enabled?)
        trigger_login_event(user)

        success!(user, message: "Success")
        request.flash['logged'] = true
      else
        fail!
      end
    else
      throw(:warden,
            action: 'saml_user_not_in_carto',
            organization_id: organization.id,
            saml_email: email)
    end
  rescue => e
    CartoDB::Logger.error(message: "Authenticating with SAML", exception: e)
    return fail!
  end
end

# @see ApplicationController.update_session_security_token
Warden::Manager.after_set_user except: :fetch do |user, auth, opts|
  auth.session(opts[:scope])[:sec_token] = Digest::SHA1.hexdigest(user.crypted_password)

  # Only at the editor, and only after new authentications, destroy other sessions
  # @see #4656
  warden_proxy = auth.env['warden']
  # On testing there is no warden global so we cannot run this logic
  if warden_proxy
    warden_sessions = auth.env['rack.session'].to_hash.select do |key, _|
      key.start_with?("warden.user") && !key.end_with?(".session")
    end
    warden_sessions.each do |_, value|
      unless value == user.username
        warden_proxy.logout(value) if warden_proxy.authenticated?(value)
      end
    end
  end
end

Warden::Manager.after_set_user do |user, auth, opts|
  # Without winning strategy (loading cookie from session) assume we want to respect expired passwords
  should_check_expiration = !auth.winning_strategy || auth.winning_strategy.affected_by_password_expiration?

  throw(:warden, action: :password_expired) if should_check_expiration && user.password_expired?
end

Warden::Strategies.add(:user_creation) do
  include CartoStrategy

  def authenticate!
    username = params[:username]
    user = ::User.where(username: username).first
    return fail! unless user

    user_creation = Carto::UserCreation.where(user_id: user.id).first
    return fail! unless user_creation

    if user_creation.autologin?
      trigger_login_event(user)

      success!(user, :message => "Success")
    else
      fail!
    end
  end
end

module Carto::Api::AuthApiAuthentication
  include CartoStrategy
  # We don't want to store a session and send a response cookie
  def store?
    false
  end

  def affected_by_password_expiration?
    false
  end

  def valid?
    base64_auth.present? || params[:api_key].present?
  end

  def base64_auth
    match = AUTH_HEADER_RE.match(request.headers['Authorization'])
    match && match[:auth]
  end

  def authenticate_user(require_master_key)
    user, token = user_and_token_from_request
    return fail! unless user && token

    api_key = user.api_keys.where(token: token)
    api_key = require_master_key ? api_key.master : api_key

    # TODO: Remove this block when all api keys are in sync 'auth_api'
    unless api_key.exists?
      return success!(user) if user.api_key == token
    end

    return fail! unless api_key.exists?
    success!(user)
  rescue
    fail!
  end

  def request_api_key
    return @request_api_key if @request_api_key

    user, token = user_and_token_from_request
    @request_api_key = user.api_keys.where(token: token).first if user && token

    # If user is logged in though other means, assume a master key
    # TODO: switch to real master api key when all api keys are in sync (FF 'auth_api')
    if !@request_api_key && current_user
      @request_api_key = current_user.api_keys.create_in_memory_master
    end

    @request_api_key
  end

  private

  AUTH_HEADER_RE = /basic\s(?<auth>\w+)/i

  def user_and_token_from_request
    return unless valid?

    if base64_auth.present?
      username, token = split_auth
      return unless username == CartoDB.extract_subdomain(request)
    elsif params[:api_key]
      token = params[:api_key]
      username = CartoDB.extract_subdomain(request)
    end
    [User[username: username], token]
  end

  def split_auth
    decoded_auth = Base64.decode64(base64_auth)
    decoded_auth.split(':')
  end
end

Warden::Strategies.add(:auth_api) do
  include Carto::Api::AuthApiAuthentication

  def authenticate!
    authenticate_user(true)
  end
end

Warden::Strategies.add(:any_auth_api) do
  include Carto::Api::AuthApiAuthentication

  def authenticate!
    authenticate_user(false)
  end
end

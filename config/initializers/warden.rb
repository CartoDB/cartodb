require 'base64'

require_dependency 'carto/user_authenticator'
require_dependency 'carto/email_cleaner'

Rails.configuration.middleware.use RailsWarden::Manager do |manager|
  manager.default_strategies :password, :api_authentication
  manager.failure_app = SessionsController
end

module LoginEventTrigger
  def trigger_login_event(user)
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
  include LoginEventTrigger

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
  include LoginEventTrigger

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
  include LoginEventTrigger

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
  include LoginEventTrigger

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
    throw(:warden)
  end
end

Warden::Strategies.add(:api_key) do
  def valid?
    params[:api_key].present?
  end

  # We don't want to store a session and send a response cookie
  def store?
    false
  end

  def authenticate!
    begin
      if (api_key = params[:api_key]) && api_key.present?
        user_name = CartoDB.extract_subdomain(request)
        if $users_metadata.HMGET("rails:users:#{user_name}", "map_key").first == api_key
          user_id = $users_metadata.HGET "rails:users:#{user_name}", 'id'
          return fail! if user_id.blank?
          user = ::User[user_id]
          success!(user)
        else
          return fail!
        end
      else
        return fail!
      end
    rescue
      return fail!
    end
  end
end

Warden::Strategies.add(:http_header_authentication) do
  include LoginEventTrigger

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
  include LoginEventTrigger
  include Carto::EmailCleaner

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

Warden::Strategies.add(:user_creation) do
  include LoginEventTrigger

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

Warden::Strategies.add(:auth_api) do
  def valid?
    base64_auth.present?
  end

  # We don't want to store a session and send a response cookie
  def store?
    false
  end

  def authenticate!
    decoded_auth = Base64.decode64(base64_auth)
    user_name, token = decoded_auth.split(':')
    return fail! unless user_name == CartoDB.extract_subdomain(request)

    user_id = $users_metadata.HGET("rails:users:#{user_name}", 'id')
    return fail! unless Carto::ApiKey.where(user_id: user_id, type: Carto::ApiKey::TYPE_MASTER, token: token).exists?

    success!(::User[user_id])
  rescue
    fail!
  end

  private

  AUTH_HEADER_RE = /basic\s(?<auth>\w+)/i

  def base64_auth
    match = AUTH_HEADER_RE.match(request.headers['Authorization'])
    match && match[:auth]
  end
end

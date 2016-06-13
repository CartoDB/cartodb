Rails.configuration.middleware.use RailsWarden::Manager do |manager|
  manager.default_strategies :password, :api_authentication
  manager.failure_app = SessionsController
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
  def valid_password_strategy_for_user(user)
    user.organization.nil? || user.organization.auth_username_password_enabled
  end

  def authenticate!
    if params[:email] && params[:password]
      if (user = ::User.authenticate(params[:email], params[:password]))
        if user.enabled? && valid_password_strategy_for_user(user)
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
  def authenticate!
    if params[:id]
      user = ::User.where(enable_account_token: params[:id]).first
      if user
        user.enable_account_token = nil
        user.save
        success!(user)
      else
        fail!
      end
    else
      fail!
    end
  end
end

Warden::Strategies.add(:google_access_token) do
  def valid_google_access_token_strategy_for_user(user)
    user.organization.nil? || user.organization.auth_google_enabled
  end

  def authenticate!
    if params[:google_access_token]
      user = GooglePlusAPI.new.get_user(params[:google_access_token])
      if user && valid_google_access_token_strategy_for_user(user)
        if user.enable_account_token.nil?
          success!(user)
        else
          throw(:warden, :action => 'account_token_authentication_error', :user_id => user.id)
        end
      else
        fail!
      end
    else
      fail!
    end
  end
end

Warden::Strategies.add(:ldap) do
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
  def valid?
    Carto::HttpHeaderAuthentication.new.valid?(request)
  end

  def authenticate!
    user = Carto::HttpHeaderAuthentication.new.get_user(request)
    return fail! unless user.present?

    success!(user)
  rescue => e
    CartoDB.report_exception(e, "Authenticating with http_header_authentication", user: user)
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
    auth.env['rack.session'].select { |key, value|
      key.start_with?("warden.user") && !key.end_with?(".session")
    }.each { |key, value|
      unless value == user.username
        warden_proxy.logout(value) if warden_proxy.authenticated?(value)
      end
    }
  end
end

Warden::Strategies.add(:user_creation) do
  def authenticate!
    username = params[:username]
    user = ::User.where(username: username).first
    return fail! unless user

    user_creation = Carto::UserCreation.where(user_id: user.id).first
    return fail! unless user_creation

    if user_creation.autologin?
      success!(user, :message => "Success")
    else
      fail!
    end
  end
end

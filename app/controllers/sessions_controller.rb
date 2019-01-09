# encoding: UTF-8
require_dependency 'google_plus_config'
require_dependency 'google_plus_api'
require_dependency 'carto/oauth/github/config'
require_dependency 'carto/oauth/google/config'
require_dependency 'carto/saml_service'
require_dependency 'carto/username_proposer'
require_dependency 'carto/email_cleaner'

require_relative '../../lib/user_account_creator'
require_relative '../../lib/cartodb/stats/authentication'

class SessionsController < ApplicationController
  include ActionView::Helpers::DateHelper
  include LoginHelper
  include Carto::EmailCleaner

  SESSION_EXPIRED = 'session_expired'.freeze
  PASSWORD_LOCKED = 'password_locked'.freeze
  MULTIFACTOR_AUTHENTICATION_INACTIVITY = 'multifactor_authentication_inactivity'.freeze

  MAX_MULTIFACTOR_AUTHENTICATION_INACTIVITY = 120.seconds

  layout 'frontend'
  ssl_required :new, :create, :destroy, :show, :unauthenticated, :account_token_authentication_error,
               :ldap_user_not_at_cartodb, :saml_user_not_in_carto, :password_expired, :password_change,
               :password_locked, :multifactor_authentication, :multifactor_authentication_verify_code

  skip_before_filter :ensure_org_url_if_org_user # Don't force org urls

  # Disables CSRF protection for the login view (create). I *think* this is safe
  # since the only transaction that a user can be tricked into doing is logging in
  # and login won't be accepted if the ADFS server's fingerprint is wrong / missing.
  # If SAML data isn't passed at all, then authentication is manually failed.
  # In case of fallback on SAML authorization failed, it will be manually checked.
  skip_before_filter :verify_authenticity_token, only: [:create], if: :saml_authentication?
  # We want the password expiration related methods to be executed regardless of CSRF token authenticity
  skip_before_filter :verify_authenticity_token, only: [:password_expired], if: :json_formatted_request?
  skip_before_filter :ensure_account_has_been_activated,
                     only: [:account_token_authentication_error, :ldap_user_not_at_cartodb, :saml_user_not_in_carto]

  before_filter :load_organization
  before_filter :initialize_oauth_config
  before_filter :api_authorization_required, only: :show
  after_action  :set_last_mfa_activity, only: [:multifactor_authentication, :multifactor_authentication_verify_code]

  PLEASE_LOGIN = 'Please, log in to continue using CARTO.'.freeze

  def new
    if current_viewer
      redirect_to(CartoDB.url(self, 'dashboard', params: { trailing_slash: true }, user: current_viewer))
    elsif saml_authentication? && !user
      # Automatically trigger SAML request on login view load -- could easily trigger this elsewhere
      redirect_to(saml_service.authentication_request)
    elsif central_enabled? && !@organization.try(:auth_enabled?)
      url = Cartodb::Central.new.login_url
      url += "?error=#{params[:error]}" if params[:error].present?
      redirect_to(url)
    else
      if params[:error] == SESSION_EXPIRED
        @flash_login_error = 'Your session has expired. ' + PLEASE_LOGIN
      elsif params[:error] == PASSWORD_LOCKED
        wait_text = time_ago_in_words(Time.now + params[:retry_after].to_i.seconds, include_seconds: true)
        @flash_login_error =
          'Too many failed login attempts.' +
          " Please, wait #{wait_text} or reset your password to continue using CARTO."
      elsif params[:error] == MULTIFACTOR_AUTHENTICATION_INACTIVITY
        @flash_login_error = 'You\'ve been logged out due to a long time of inactivity. ' + PLEASE_LOGIN
      end
      render
    end
  end

  def create
    strategies, username = saml_strategy_username || ldap_strategy_username ||
                           google_strategy_username || credentials_strategy_username

    unless strategies
      return saml_authentication? ? render_403 : render(action: 'new')
    end

    candidate_user = Carto::User.where(username: username).first

    if central_enabled? && @organization && candidate_user && !candidate_user.belongs_to_organization?(@organization)
      @flash_login_error = 'The user is not part of the organization'
      @user_login_url = Cartodb::Central.new.login_url
      return render(action: 'new')
    end

    user = authenticate!(*strategies, scope: username)
    CartoDB::Stats::Authentication.instance.increment_login_counter(user.email)

    redirect_to after_login_url(user)
  end

  def destroy
    saml_authentication? && saml_service.try(:logout_url_configured?) ? saml_logout : do_logout
  end

  def show
    render :json => {:email => current_user.email, :uid => current_user.id, :username => current_user.username}
  end

  def multifactor_authentication
    @user = current_viewer
    return redirect_to after_login_url(@user) unless multifactor_authentication_required?

    @mfa = @user.active_multifactor_authentication
    render action: 'multifactor_authentication'
  rescue Carto::UnauthorizedError, Warden::NotAuthenticated
    unauthenticated
  end

  def multifactor_authentication_verify_code
    user = ::User.where(id: params[:user_id]).first
    url = after_login_url(user)

    if params[:skip] == "true" && user.active_multifactor_authentication.needs_setup?
      disable_mfa(user.id)
    else
      return multifactor_authentication_inactivity if mfa_inactivity_period_expired?(user)

      retry_after = user.password_login_attempt
      if retry_after != ::User::LOGIN_NOT_RATE_LIMITED
        cdb_logout
        return password_locked(retry_after)
      end

      user.active_multifactor_authentication.verify!(params[:code])
      user.reset_password_rate_limit
    end

    warden.session(user.username)[:multifactor_authentication_performed] = true
    redirect_to url
  rescue Carto::UnauthorizedError, Warden::NotAuthenticated
    unauthenticated
  end

  def unauthenticated
    username = extract_username(request, params)
    CartoDB::Stats::Authentication.instance.increment_failed_login_counter(username)

    # Use an instance variable to show the error instead of the flash hash. Setting the flash here means setting
    # the flash for the next request and we want to show the message only in the current one
    @login_error = if mfa_request?
                     'Verification code is not valid'
                   elsif params[:email].blank? && params[:password].blank?
                     'Can\'t be blank'
                   else
                     'Your account or your password is not ok'
                   end

    respond_to do |format|
      format.html do
        return multifactor_authentication if mfa_request?
        return render action: 'new'
      end
      format.json do
        head :unauthorized
      end
    end
  end

  def account_token_authentication_error
    warden.custom_failure!
    user_id = warden.env['warden.options'][:user_id] if warden.env['warden.options']
    @user = ::User.where(id: user_id).first if user_id
  end

  # Meant to be called always from warden LDAP authentication
  def ldap_user_not_at_cartodb
    render action: 'new' and return unless verify_warden_failure

    username = warden.env['warden.options'][:cartodb_username]
    organization_id = warden.env['warden.options'][:organization_id]
    email = warden.env['warden.options'][:ldap_email].blank? ? nil : warden.env['warden.options'][:ldap_email]
    created_via = Carto::UserCreation::CREATED_VIA_LDAP

    create_user(username, organization_id, email, created_via)
  end

  def saml_user_not_in_carto
    # ensure to be called only from warden SAML authentication
    unless verify_warden_failure
      render action: 'new'
      return
    end

    saml_email = warden.env['warden.options'][:saml_email]
    username = CartoDB::UserAccountCreator.email_to_username(saml_email)
    unique_username = Carto::UsernameProposer.find_unique(username)
    organization_id = warden.env['warden.options'][:organization_id]
    created_via = Carto::UserCreation::CREATED_VIA_SAML

    create_user(unique_username, organization_id, saml_email, created_via)
  end

  def verify_warden_failure
    warden.custom_failure!
    warden.env['warden.options']
  end

  def password_change
    username = warden.env['warden.options'][:username] if warden.env['warden.options']
    redirect_to edit_password_change_url(username) if username
  end

  def password_locked(retry_after = warden.env['warden.options'][:retry_after])
    warden.custom_failure!
    redirect_to login_url + "?error=#{PASSWORD_LOCKED}&retry_after=#{retry_after}"
  end

  def password_expired
    warden.custom_failure!
    cdb_logout
    session[:return_to] = request.original_url

    respond_to do |format|
      format.html do
        url = central_enabled? && !@organization.try(:auth_enabled?) ? Cartodb::Central.new.login_url : login_url
        redirect_to(url + "?error=#{SESSION_EXPIRED}")
      end
      format.json do
        render(json: { error: SESSION_EXPIRED }, status: 403)
      end
    end
  end

  def multifactor_authentication_inactivity
    warden.custom_failure!
    cdb_logout

    redirect_to login_url + "?error=#{MULTIFACTOR_AUTHENTICATION_INACTIVITY}"
  end

  def create_user(username, organization_id, email, created_via)
    @organization = ::Organization.where(id: organization_id).first

    account_creator = CartoDB::UserAccountCreator.new(created_via)

    account_creator.with_organization(@organization)
                   .with_username(username)
    account_creator.with_email(email) unless email.nil?

    if account_creator.valid?
      creation_data = account_creator.enqueue_creation(self)

      flash.now[:success] = 'User creation in progress'
      @user_creation_id = creation_data[:id]
      @user_name = creation_data[:id]
      @redirect_url = CartoDB.url(self, 'login')
      render 'shared/signup_confirmation'
    else
      errors = account_creator.validation_errors
      CartoDB.notify_debug('User not valid at signup', { errors: errors } )
      @signup_source = created_via.upcase
      @signup_errors = errors
      render 'shared/signup_issue'
    end
  rescue => e
    new_user = account_creator.nil? ? "account_creator nil" : account_creator.user.inspect
    CartoDB.report_exception(e, "Creating user", new_user: new_user)
    flash.now[:error] = e.message
    render action: 'new'
  end

  protected

  def initialize_oauth_config
    @oauth_configs = [google_plus_config, github_config].compact
  end

  def google_plus_config
    unless @organization && !@organization.auth_google_enabled
      Carto::Oauth::Google::Config.instance(form_authenticity_token, google_oauth_url,
                                            invitation_token: params[:invitation_token],
                                            organization_name: @organization.try(:name))
    end
  end

  def github_config
    unless @organization && !@organization.auth_github_enabled
      Carto::Oauth::Github::Config.instance(form_authenticity_token, github_url,
                                            invitation_token: params[:invitation_token],
                                            organization_name: @organization.try(:name))
    end
  end

  private

  def mfa_request?
    params[:code].presence || params[:skip].presence
  end

  def set_last_mfa_activity
    user = ::User.where(id: params[:user_id]).first || current_viewer
    warden.session(user.username)[:multifactor_authentication_last_activity] = Time.now.to_i if user
  rescue Warden::NotAuthenticated
  end

  def mfa_inactivity_period_expired?(user)
    time_inactive = Time.now.to_i - warden.session(user.username)[:multifactor_authentication_last_activity]
    time_inactive > MAX_MULTIFACTOR_AUTHENTICATION_INACTIVITY
  rescue Warden::NotAuthenticated
  end

  def after_login_url(user)
    return login_url unless user
    session.delete('return_to') || (user.public_url + CartoDB.path(self, 'dashboard', trailing_slash: true))
  end

  def central_enabled?
    Cartodb::Central.sync_data_with_cartodb_central?
  end

  def extract_username(request, params)
    # params[:email] can contain a username
    email = params[:email]
    username = if email.present?
                 email.include?('@') ? username_from_user_by_email(params[:email]) : email
               else
                 CartoDB.extract_subdomain(request)
               end
    username.strip.downcase if username
  end

  def username_from_user_by_email(email)
    ::User.where(email: clean_email(email)).first.try(:username)
  end

  def ldap_strategy_username
    if ldap_authentication?
      username = params[:user_domain].present? ? params[:user_domain] : params[:email]
      # INFO: LDAP allows characters that we don't
      [[:ldap, :password], Carto::Ldap::Manager.sanitize_for_cartodb(username)]
    end
  end

  def saml_strategy_username
    if saml_authentication?
      email = saml_service.get_user_email(params[:SAMLResponse])
      if email
        [:saml, username_from_user_by_email(email)]
      else
        # This stops trying other strategies. Important because CSRF is not checked for SAML.
        [nil, nil]
      end
    end
  end

  def google_strategy_username
    if google_authentication? && !user_password_authentication?
      user = GooglePlusAPI.new.get_user(params[:google_access_token])
      if user
        [:google_access_token, params[:user_domain].present? ? params[:user_domain] : user.username]
      elsif user == false
        # token not valid
        nil
      else
        # token valid, unknown user
        @google_plus_config.unauthenticated_valid_access_token = params[:google_access_token]
        nil
      end
    end
  end

  def credentials_strategy_username
    [:password, extract_username(request, params)] if user_password_authentication?
  end

  def user_password_authentication?
    params && params['email'].present? && params['password'].present?
  end

  def google_authentication?
    params[:google_access_token].present? && @google_plus_config.present?
  end

  def ldap_authentication?
    Carto::Ldap::Manager.new.configuration_present?
  end

  def saml_authentication?
    saml_service.try(:enabled?)
  end

  def saml_service
    if load_organization
      @saml_service ||= Carto::SamlService.new(load_organization)
    end
  end

  def load_organization
    return @organization if @organization
    # Useful for logout
    return current_user.organization if current_user

    subdomain = CartoDB.extract_subdomain(request)
    @organization = Carto::Organization.where(name: subdomain).first if subdomain
  end

  def do_logout
    # Make sure sessions are destroyed on both scopes: username and default
    cdb_logout

    redirect_to default_logout_url
  end

  def saml_logout
    if params[:SAMLRequest]
      # If we're given a logout request, handle it in the IdP logout initiated method
      redirect_to saml_service.idp_logout_request(params[:SAMLRequest], params[:RelayState]) { cdb_logout }
    elsif params[:SAMLResponse]
      # We've been given a response back from the IdP, process it
      begin
        saml_service.process_logout_response(params[:SAMLResponse])
      rescue => e
        CartoDB::Logger.warning(exception: e, message: 'Error proccessing SAML logout')
      ensure
        cdb_logout
      end

      redirect_to default_logout_url
    else
      # Initiate SLO (send Logout Request)
      redirect_to saml_service.sp_logout_request(current_user)
    end
  end

  def default_logout_url
    # User could've been just deleted
    username = CartoDB.extract_subdomain(request)
    if username && (Carto::User.exists?(username: username) || Carto::Organization.exists?(name: username))
      CartoDB.url(self, 'public_visualizations_home')
    elsif Cartodb::Central.sync_data_with_cartodb_central?
      "https://carto.com"
    else
      "/404.html"
    end
  end

  def disable_mfa(user_id)
    service = Carto::UserMultifactorAuthUpdateService.new(user_id: user_id)
    service.update(enabled: false)
  end
end

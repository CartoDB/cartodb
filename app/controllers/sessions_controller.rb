# encoding: UTF-8
require_dependency 'google_plus_config'
require_dependency 'google_plus_api'
require_dependency 'oauth/github/config'
require_dependency 'carto/saml_service'

require_relative '../../lib/user_account_creator'
require_relative '../../lib/cartodb/stats/authentication'

class SessionsController < ApplicationController
  include LoginHelper

  layout 'frontend'
  ssl_required :new, :create, :destroy, :show, :unauthenticated, :account_token_authentication_error,
               :ldap_user_not_at_cartodb

  skip_before_filter :ensure_org_url_if_org_user # Don't force org urls

  # Disables CSRF protection for the login view (create). I *think* this is safe
  # since the only transaction that a user can be tricked into doing is logging in
  # and login won't be accepted if the ADFS server's fingerprint is wrong / missing.
  # If SAML data isn't passed at all, then authentication is manually failed.
  # In case of fallback on SAML authorization failed, it will be manually checked.
  skip_before_filter :verify_authenticity_token, only: [:create], if: :saml_authentication?
  skip_before_filter :ensure_account_has_been_activated,
                     only: [:account_token_authentication_error, :ldap_user_not_at_cartodb]

  before_filter :load_organization
  before_filter :initialize_google_plus_config,
                :initialize_github_config
  before_filter :api_authorization_required, only: :show

  def new
    if logged_in?(CartoDB.extract_subdomain(request))
      redirect_to CartoDB.path(self, 'dashboard', {trailing_slash: true}) and return
    end

    # Automatically trigger SAML request on login view load -- could easily trigger this elsewhere
    if saml_authentication? && !user
      redirect_to saml_service.authentication_request
    end
  end

  def create
    user = ldap_user || saml_user || credentials_or_google_user

    return render(action: 'new') unless user.present?

    CartoDB::Stats::Authentication.instance.increment_login_counter(user.email)

    redirect_to user.public_url << CartoDB.path(self, 'dashboard', {trailing_slash: true})
  end

  def destroy
    # Make sure sessions are destroyed on both scopes: username and default
    cdb_logout

    redirect_to CartoDB.url(self, 'public_visualizations_home')
  end

  def show
    render :json => {:email => current_user.email, :uid => current_user.id, :username => current_user.username}
  end

  def unauthenticated
    username = extract_username(request, params)
    CartoDB::Stats::Authentication.instance.increment_failed_login_counter(username)

    # Use an instance variable to show the error instead of the flash hash. Setting the flash here means setting
    # the flash for the next request and we want to show the message only in the current one
    @login_error = (params[:email].blank? && params[:password].blank?) ? 'Can\'t be blank' : 'Your account or your password is not ok'

    respond_to do |format|
      format.html do
        render :action => 'new' and return
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
    warden.custom_failure!

    if !warden.env['warden.options']
      render :action => 'new' and return
    end

    cartodb_username = warden.env['warden.options'][:cartodb_username]
    organization_id = warden.env['warden.options'][:organization_id]
    ldap_username = warden.env['warden.options'][:ldap_username]
    ldap_email = warden.env['warden.options'][:ldap_email].blank? ? nil : warden.env['warden.options'][:ldap_email]

    @organization = ::Organization.where(id: organization_id).first

    account_creator = CartoDB::UserAccountCreator.new(Carto::UserCreation::CREATED_VIA_LDAP)

    account_creator.with_organization(@organization)
                   .with_username(cartodb_username)
    account_creator.with_email(ldap_email) unless ldap_email.nil?

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
      @signup_source = 'LDAP'
      @signup_errors = errors
      render 'shared/signup_issue'
    end
  rescue => e
    CartoDB.report_exception(e, "Creating LDAP user", new_user: account_creator.nil? ? "account_creator nil" : account_creator.user.inspect)
    flash.now[:error] = e.message
    render action: 'new'
  end

  protected

  def initialize_google_plus_config

    if !@organization.nil?
      # TODO: remove duplication (app/controllers/admin/organizations_controller.rb)
      signup_action = "#{CartoDB.protocol}://#{@organization.name}.#{CartoDB.account_host}#{CartoDB.path(self, 'signup_organization_user')}"
    elsif Cartodb::Central.sync_data_with_cartodb_central?
      signup_action = Cartodb::Central.new.google_signup_url
    else
      signup_action = '/google/signup'
    end

    button_color = @organization.nil? || @organization.color.nil? ? nil : organization_color(@organization)
    @google_plus_config = ::GooglePlusConfig.instance(CartoDB, Cartodb.config, signup_action, 'google_access_token', button_color)
  end

  def initialize_github_config
    unless @organization && !@organization.auth_github_enabled
      @github_config = Carto::Github::Config.instance(form_authenticity_token,
                                                      invitation_token: params[:invitation_token],
                                                      organization_name: @organization.try(:name))
      @button_color = @organization && @organization.color ? organization_color(@organization) : nil
    end
  end

  def extract_username(request, params)
    (params[:email].present? ? username_from_email(params[:email]) : CartoDB.extract_subdomain(request)).strip.downcase
  end

  def username_from_email(email)
    user = ::User.where(email: email).first
    user.present? ? user.username : email
  end

  private

  def ldap_user
    authenticate_with_ldap if ldap_authentication?
  end

  def saml_user
    user = authenticate_with_saml if saml_authentication?
    if !user && saml_authentication?
      # Convenient because it's disabled on SAML
      verify_authenticity_token
    end
    user
  end

  # This acts as a fallback if previous authentications didn't return a valid user.
  def credentials_or_google_user
    authenticate_with_credentials_or_google
  end

  def authenticate_with_ldap
    username = params[:user_domain].present? ?  params[:user_domain] : params[:email]
    # INFO: LDAP allows characters that we don't
    authenticate(:ldap, scope: Carto::Ldap::Manager.sanitize_for_cartodb(username))
  end

  def authenticate_with_saml
    return nil unless params[:SAMLResponse].present?

    username = saml_service.username(params[:SAMLResponse])
    username ? authenticate!(:saml, scope: username) : nil
  end

  # TODO: split
  def authenticate_with_credentials_or_google
    user = if !user_password_authentication? && params[:google_access_token].present? && @google_plus_config.present?
        user = GooglePlusAPI.new.get_user(params[:google_access_token])
        if user
          authenticate!(:google_access_token, scope: params[:user_domain].present? ?  params[:user_domain] : user.username)
        elsif user == false
          # token not valid
          nil
        else
          # token valid, unknown user
          @google_plus_config.unauthenticated_valid_access_token = params[:google_access_token]
          nil
        end
      else
        username = extract_username(request, params)
        user = authenticate!(:password, scope: username)
      end

    user
  end

  def user_password_authentication?
    params && params['email'].present? && params['password'].present?
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

    subdomain = CartoDB.extract_subdomain(request)
    @organization = Carto::Organization.where(name: subdomain).first if subdomain
  end

end

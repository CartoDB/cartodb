require_dependency 'google_plus_config'
require_dependency 'account_creator'

require_relative '../../lib/user_account_creator'

class SignupController < ApplicationController
  include LoginHelper
  include AccountCreator

  layout 'frontend'

  ssl_required :signup, :create, :create_http_authentication, :create_http_authentication_in_progress

  skip_before_filter :http_header_authentication,
                     only: [:create_http_authentication, :create_http_authentication_in_progress]

  before_filter :load_organization, only: [:create_http_authentication, :create_http_authentication_in_progress]
  before_filter :check_organization_quotas, only: [:create_http_authentication]
  before_filter :load_mandatory_organization, only: [:signup, :create]
  before_filter :disable_if_ldap_configured
  before_filter :initialize_oauth_config

  def signup
    email = params[:email].present? ? params[:email] : nil
    @user = ::User.new(email: email)
  end

  def create
    account_creator = CartoDB::UserAccountCreator.new(Carto::UserCreation::CREATED_VIA_ORG_SIGNUP).
                      with_organization(@organization, viewer: invitation.try(:viewer)).
                      with_invitation_token(params[:invitation_token])

    raise "Organization doesn't allow user + password authentication" if user_password_signup? && !@organization.auth_username_password_enabled

    if params[:user]
      account_creator.with_username(params[:user][:username]) if params[:user][:username].present?
      account_creator.with_email(params[:user][:email]) if params[:user][:email].present?
      account_creator.with_password(params[:user][:password]) if params[:user][:password].present?
    end

    oauth_config = oauth_provider
    if oauth_config
      api = oauth_config.class.api_class.new(oauth_config, params[:oauth_access_token])
      @oauth_fields = api.hidden_fields
      account_creator.with_oauth_api(api)
    end

    if account_creator.valid?
      trigger_account_creation(account_creator)
      render 'shared/signup_confirmation'
    else
      @user = account_creator.user
      errors = account_creator.validation_errors
      CartoDB.notify_debug('User not valid at signup', { errors: errors } )
      if errors['organization'] && !errors[:organization].empty?
        @signup_source = 'Organization'
        @signup_errors = errors
        render 'shared/signup_issue'
      else
        if google_signup? && existing_user(@user)
          flash.now[:error] = "User already registered, go to login"
        elsif @user.errors.empty?
          # No need for additional errors if there're field errors
          flash.now[:error] = 'User not valid'
        end
        render action: 'signup', status: @user.errors.empty? ? 200 : 422
      end
    end

  rescue => e
    @user ||= ::User.new
    CartoDB.notify_exception(e, { new_user: account_creator.user.inspect })
    flash.now[:error] = e.message
    render action: 'signup', status: 400
  end

  def create_http_authentication
    authenticator = Carto::HttpHeaderAuthentication.new
    render_404 and return false unless authenticator.autocreation_enabled?
    render_500 and return false unless authenticator.autocreation_valid?(request)
    render_403 and return false unless authenticator.valid?(request)

    account_creator = CartoDB::UserAccountCreator.
      new(Carto::UserCreation::CREATED_VIA_HTTP_AUTENTICATION).
      with_email_only(authenticator.email(request))

    account_creator = account_creator.with_organization(@organization) if @organization

    if account_creator.valid?
      trigger_account_creation(account_creator)

      render 'shared/signup_confirmation'
    else
      render_500
    end
  rescue => e
    CartoDB.report_exception(e, "Creating user with HTTP authentication", new_user: account_creator.user.inspect)
    flash.now[:error] = e.message
    render_500
  end

  def create_http_authentication_in_progress
    authenticator = Carto::HttpHeaderAuthentication.new
    if !authenticator.creation_in_progress?(request)
      redirect_to CartoDB.url(self, 'login')
    else
      render 'shared/signup_confirmation'
    end
  end

  private

  def oauth_provider
    case params[:oauth_provider]
    when 'google'
      @google_config
    when 'github'
      @github_config
    end
  end

  def existing_user(user)
    !Carto::User.find_by_username_and_email(user.username, user.email).nil?
  end

  def google_access_token_from_params
    [params.fetch(:google_access_token, nil), params.fetch(:google_signup_access_token, nil)].uniq.compact.first
  end

  def google_signup?
    google_access_token_from_params.present?
  end

  def user_password_signup?
    params && params['user'] && params['user']['username'].present? && params['user']['email'].present? && params['user']['password'].present?
  end

  def initialize_oauth_config
    @oauth_configs = [google_plus_config, github_config].compact
  end

  def google_plus_config
    unless @organization && !@organization.auth_google_enabled
      @google_config = Carto::Oauth::Google::Config.instance(form_authenticity_token, google_oauth_url,
                                                             invitation_token: params[:invitation_token],
                                                             organization_name: @organization.try(:name))
    end
  end

  def github_config
    unless @organization && !@organization.auth_github_enabled
      @github_config = Carto::Oauth::Github::Config.instance(form_authenticity_token, github_url,
                                                             invitation_token: params[:invitation_token],
                                                             organization_name: @organization.try(:name))
    end
  end

  def load_organization
    if CartoDB.subdomainless_urls?
      subdomain = request.host.to_s.gsub(".#{CartoDB.session_domain}", '')
      if subdomain == CartoDB.session_domain
        subdomain = params[:user_domain]
      end
    else
      subdomain = CartoDB.subdomain_from_request(request)
    end

    if subdomain && subdomain != CartoDB.session_domain
      @organization = ::Organization.where(name: subdomain).first
    end
  end

  def check_organization_quotas
    if @organization
      check_signup_errors = Sequel::Model::Errors.new
      user = ::User.new_with_organization(@organization, viewer: @invitation.try(:viewer))
      @organization.validate_for_signup(check_signup_errors, user)
      @signup_source = 'Organization'
      @signup_errors = check_signup_errors
      render 'shared/signup_issue' and return false if check_signup_errors.length > 0
    end
  end

  def load_mandatory_organization
    load_organization
    return render_404 unless @organization && (@organization.signup_page_enabled || invitation)
    check_organization_quotas
  end

  def disable_if_ldap_configured
    render_404 and return false if Carto::Ldap::Manager.new.configuration_present?
  end

  def invitation
    return @invitation if @invitation
    email = (params[:user] && params[:user][:email]) || params[:email]
    token = params[:invitation_token]
    return unless email && token
    invitations = Carto::Invitation.query_with_valid_email(email).where(organization_id: @organization.id).all
    @invitation = invitations.find { |i| i.token(email) == token }
  end
end

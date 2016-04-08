require_dependency 'google_plus_config'

require_relative '../../lib/user_account_creator'

class SignupController < ApplicationController
  include LoginHelper

  layout 'frontend'

  ssl_required :signup, :create, :create_http_authentication

  skip_before_filter :http_header_authentication, only: [:create_http_authentication]

  before_filter :load_organization, only: [:create_http_authentication]
  before_filter :check_organization_quotas, only: [:create_http_authentication]
  before_filter :load_mandatory_organization, only: [:signup, :create]
  before_filter :disable_if_ldap_configured
  before_filter :initialize_google_plus_config

  def signup
    email = params[:email].present? ? params[:email] : nil
    @user = ::User.new(email: email)
  end

  def create
    account_creator = CartoDB::UserAccountCreator.new(Carto::UserCreation::CREATED_VIA_ORG_SIGNUP).
                      with_organization(@organization).
                      with_invitation_token(params[:invitation_token])

    raise "Organization doesn't allow user + password authentication" if user_password_signup? && !@organization.auth_username_password_enabled

    google_access_token = google_access_token_from_params
    # Merge both sources (signup and login) in a single param
    params[:google_access_token] = google_access_token
    if !user_password_signup? && google_signup? && !@google_plus_config.nil?
      raise "Organization doesn't allow Google authentication" if !@organization.auth_google_enabled
      account_creator.with_google_token(google_access_token)

    end

    if params[:user]
      account_creator.with_username(params[:user][:username]) if params[:user][:username].present?
      account_creator.with_email(params[:user][:email]) if params[:user][:email].present?
      account_creator.with_password(params[:user][:password]) if params[:user][:password].present?
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

  private

  def trigger_account_creation(account_creator)
    creation_data = account_creator.enqueue_creation(self)

    flash.now[:success] = 'User creation in progress'
    # Template variables
    @user_creation_id = creation_data[:id]
    @user_name = creation_data[:id]
    @redirect_url = CartoDB.url(self, 'dashboard')
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

  def initialize_google_plus_config
    button_color = @organization.nil? || @organization.color.nil? ? nil : organization_color(@organization)
    @google_plus_config = ::GooglePlusConfig.instance(CartoDB, Cartodb.config, '/signup', 'google_access_token', button_color)
  end

  def load_organization
    subdomain = CartoDB.subdomainless_urls? ? request.host.to_s.gsub(".#{CartoDB.session_domain}", '') : CartoDB.subdomain_from_request(request)
    @organization = ::Organization.where(name: subdomain).first if subdomain
  end

  def check_organization_quotas
    if @organization
      check_signup_errors = Sequel::Model::Errors.new
      @organization.validate_for_signup(check_signup_errors, ::User.new_with_organization(@organization).quota_in_bytes)
      @signup_source = 'Organization'
      render 'shared/signup_issue' and return false if check_signup_errors.length > 0
    end
  end

  def load_mandatory_organization
    load_organization
    render_404 and return false unless @organization && (@organization.signup_page_enabled || valid_email_invitation_token?)
    check_organization_quotas
  end

  def disable_if_ldap_configured
    render_404 and return false if Carto::Ldap::Manager.new.configuration_present?
  end

  def valid_email_invitation_token?
    if params && params[:email] && params[:invitation_token]
      invitation = Carto::Invitation.find_by_seed(params[:invitation_token])
      invitation.present? && invitation.users_emails.include?(params[:email]) ? true : false
    end
  end

end

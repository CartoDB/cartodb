require_dependency 'google_plus_config'

require_relative '../../lib/user_account_creator'

class SignupController < ApplicationController
  include LoginHelper

  layout 'frontend'

  ssl_required :signup, :create

  before_filter :load_organization
  before_filter :disable_if_ldap_configured
  before_filter :initialize_google_plus_config

  def signup
    @user = ::User.new
  end

  def create
    account_creator = CartoDB::UserAccountCreator.new
                                                 .with_organization(@organization)

    google_access_token = [params.fetch(:google_access_token, nil), params.fetch(:google_signup_access_token, nil)].uniq.compact.first
    # Merge both sources (signup and login) in a single param
    params[:google_access_token] = google_access_token

    if !user_password_signup? && google_access_token.present? && @google_plus_config.present?
      account_creator.with_google_token(google_access_token)
    end

    if params[:user]
      account_creator.with_username(params[:user][:username]) if params[:user][:username].present?
      account_creator.with_email(params[:user][:email]) if params[:user][:email].present?
      account_creator.with_password(params[:user][:password]) if params[:user][:password].present?
    end

    if account_creator.valid?
      creation_data = account_creator.enqueue_creation(self)

      flash.now[:success] = 'User creation in progress'
      # Template variables
      @user_creation_id = creation_data[:id]
      @user_name = creation_data[:id]
      @redirect_url = CartoDB.url(self, 'dashboard')
      render 'shared/signup_confirmation'
    else
      @user = account_creator.user
      errors = account_creator.validation_errors
      CartoDB.notify_debug('User not valid at signup', { errors: errors } )
      if errors['organization'] && !errors[:organization].empty?
        @signup_source = 'Organization'
        render 'shared/signup_issue'
      else
        flash.now[:error] = 'User not valid'
        render action: 'signup'
      end
    end

  rescue => e
    CartoDB.notify_exception(e, { new_user: account_creator.user.inspect })
    flash.now[:error] = e.message
    render action: 'signup'
  end

  private

  def user_password_signup?
    params && params['user'] && params['user']['username'].present? && params['user']['email'].present? && params['user']['password'].present?
  end

  def initialize_google_plus_config
    button_color = @organization.nil? || @organization.color.nil? ? nil : organization_color(@organization)
    @google_plus_config = ::GooglePlusConfig.instance(CartoDB, Cartodb.config, '/signup', 'google_access_token', button_color)
  end

  def load_organization
    subdomain = CartoDB.subdomain_from_request(request)
    @organization = ::Organization.where(name: subdomain).first if subdomain
    render_404 and return false unless @organization && @organization.signup_page_enabled
    check_signup_errors = Sequel::Model::Errors.new
    @organization.validate_for_signup(check_signup_errors, ::User.new_with_organization(@organization).quota_in_bytes)
    render 'organization_signup_issue' if check_signup_errors.length > 0
  end

  def disable_if_ldap_configured
    render_404 and return false if Carto::Ldap::Manager.new.configuration_present?
  end

end

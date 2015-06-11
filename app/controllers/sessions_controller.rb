# encoding: UTF-8
require_dependency '../../lib/google_plus_api'
require_dependency '../../lib/google_plus_config'

class SessionsController < ApplicationController
  layout 'frontend'
  ssl_required :new, :create, :destroy, :show, :unauthenticated

  before_filter :initialize_google_plus_config
  before_filter :api_authorization_required, :only => :show
  # Don't force org urls
  skip_before_filter :ensure_org_url_if_org_user


  def new
    if logged_in?(CartoDB.extract_subdomain(request))
      redirect_to CartoDB.path(self, 'dashboard', {trailing_slash: true}) and return
    end
  end

  def create
    user = if params[:google_access_token].present? && @google_plus_config.present?
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

    render :action => 'new' and return unless params[:user_domain].present? || user.present?

    CartodbStats.increment_login_counter(user.email)

    redirect_to user.public_url << CartoDB.path(self, 'dashboard', {trailing_slash: true})
  end

  def destroy
    logout(CartoDB.extract_subdomain(request))
    redirect_to CartoDB.url(self, 'public_visualizations_home')
  end

  def show
    render :json => {:email => current_user.email, :uid => current_user.id, :username => current_user.username}
  end

  def unauthenticated
    username = extract_username(request, params)
    CartodbStats.increment_failed_login_counter(username)
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

  protected

  def initialize_google_plus_config
    signup_action = Cartodb::Central.sync_data_with_cartodb_central? ? Cartodb::Central.new.google_signup_url : '/google/signup'
    @google_plus_config = ::GooglePlusConfig.instance(CartoDB, Cartodb.config, signup_action)
  end

  def extract_username(request, params)
    (params[:email].present? ? username_from_email(params[:email]) : CartoDB.extract_subdomain(request)).strip.downcase
  end

  def username_from_email(email)
    user = User.where(email: email).first
    user.present? ? user.username : email
  end

end

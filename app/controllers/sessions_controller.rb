# coding: UTF-8

class SessionsController < ApplicationController
  layout 'front_layout'
  ssl_required :new, :create, :destroy, :show, :unauthenticated

  before_filter :api_authorization_required, :only => :show
  # Don't force org urls
  skip_before_filter :ensure_org_url_if_org_user

  def new
    if logged_in?(CartoDB.extract_subdomain(request))
      redirect_to dashboard_path(user_domain: params[:user_domain], trailing_slash: true) and return
    end
  end

  def create
    user_id = (params[:email].present? ? params[:email] : CartoDB.extract_subdomain(request)).strip.downcase
    user = authenticate!(:password, scope: user_id)
    CartodbStats.increment_login_counter(params[:email])

    destination_url = dashboard_path(user_domain: params[:user_domain], trailing_slash: true)
    if user.organization.nil?
      destination_url = CartoDB.base_url(user.username) << destination_url
    else
      destination_url = CartoDB.base_url(user.organization.name, user.username) << destination_url
    end
    # Removed ATM for multiuser: session[:return_to] || ...
    redirect_to destination_url
  end

  def destroy
    logout(CartoDB.extract_subdomain(request))
    redirect_to Cartodb.config[:account_host].blank? ? 'http://www.cartodb.com' : "http://#{Cartodb.config[:account_host]}"
  end

  def show
    render :json => {:email => current_user.email, :uid => current_user.id, :username => current_user.username}
  end

  def unauthenticated
    CartodbStats.increment_failed_login_counter(params[:email])
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

end

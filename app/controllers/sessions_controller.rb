# coding: UTF-8

class SessionsController < ApplicationController
  layout 'front_layout'
  ssl_required :new, :create, :destroy, :show, :unauthenticated

  before_filter :api_authorization_required, :only => :show

  def new
    if logged_in?(request.subdomain)
      redirect_to dashboard_path and return
    end
  end

  def create
    authenticate!(:password, :scope => request.subdomain)
    CartodbStats.increment_login_counter(params[:email])
    redirect_to(session[:return_to] || dashboard_path)
  end

  def destroy
    logout(request.subdomain)
    redirect_to "http://www.cartodb.com"
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
        if api_request?
          head :unauthorized
        else
          render :action => 'new' and return
        end
      end
      format.json do
        head :unauthorized
      end
    end
  end

end

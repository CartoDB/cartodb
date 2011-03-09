# coding: UTF-8

class SessionsController < ApplicationController
  ssl_required :new, :create, :destroy, :show, :unauthenticated

  before_filter :api_authorization_required, :only => :show

  layout 'front_layout'

  def new
    if logged_in?
      redirect_to dashboard_path and return
    end
  end

  def create
    authenticate!(:password)
    redirect_to dashboard_path
  end

  def destroy
    logout
    redirect_to root_path
  end

  def show
    respond_to do |format|
      format.json do
        render :json => {:email => current_user.email, :uid => current_user.id, :username => current_user.username}.to_json, :status => 200
      end
    end
  end

  def unauthenticated
    flash[:alert] = 'Your account or your password is not ok'
    respond_to do |format|
      format.html do
        if request.headers['Authorization']
          render :nothing => true, :status => 401
        else
          render :action => 'new' and return
        end
      end
      format.json do
        render :nothing => true, :status => 401
      end
    end
  end

end

class SessionsController < ApplicationController

  def new
  end

  def create
    authenticate!
    redirect_to dashboard_path
  rescue ActionController::RedirectBackError
    redirect_to root_path
  end

  def unauthenticated
    redirect_to root_path
  end

end

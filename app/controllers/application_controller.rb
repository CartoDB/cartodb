class ApplicationController < ActionController::Base
  protect_from_forgery

  protected

  def login_required
    authenticated? || not_authorized
  end

  def not_authorized
    redirect_to login_path and return
  end

end

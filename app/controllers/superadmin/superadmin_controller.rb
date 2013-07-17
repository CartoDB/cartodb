class Superadmin::SuperadminController < ActionController::Base  
  include SslRequirement
  before_filter :authenticate
  
  protected

  def authenticate
    return true if authenticated?(request.subdomain) && current_user.admin
    authenticate_or_request_with_http_basic do |username, password|
      username == Cartodb.config[:superadmin]["username"] && password == Cartodb.config[:superadmin]["password"]
    end
  end

  def current_user
    super(request.subdomain)
  end
end

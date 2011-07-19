class Superadmin::SuperadminController < ActionController::Base
  include SslRequirement
  
  before_filter :authenticate

  protected

  def authenticate
    authenticate_or_request_with_http_basic do |username, password|
      username == APP_CONFIG[:superadmin]["username"] && password == APP_CONFIG[:superadmin]["password"]
    end
  end
end

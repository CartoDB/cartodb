# coding: UTF-8

class ApplicationController < ActionController::Base

  rescue_from RecordNotFound, :with => :render_404

  protect_from_forgery

  $progress ||= {}

  protected

  def api_authorization_required
    api_key_authenticated? || authenticated? || not_authorized
  end

  def api_authenticated?
    return env['warden'].authenticate(:api_key)
  end

  def oauth_authentication
    return env['warden'].authenticate(:oauth_token)
  end

  def render_404
    respond_to do |format|
      format.html do
        render :file => "public/404.html.erb", :status => 404, :layout => false
      end
      format.json do
        render :nothing => true, :status => 404
      end
    end
  end

  def login_required
    authenticated? || not_authorized
  end

  def not_authorized
    respond_to do |format|
      format.html do
        redirect_to login_path and return
      end
      format.json do
        render :nothing => true, :status => 401
      end
    end
  end

  def table_privacy_text(table)
    table.private? ? 'PRIVATE' : 'PUBLIC'
  end
  helper_method :table_privacy_text

  def translate_error(error_message)
    if error_message =~ /^PGError:\s+ERROR:\s+relation\s+\"([^\\\"]+)\" already exists$/
      return "A table with name \"#{$1}\" already exists"
    else
      return error_message
    end
  end

end

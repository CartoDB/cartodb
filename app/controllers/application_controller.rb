# coding: UTF-8

class ApplicationController < ActionController::Base

  rescue_from RecordNotFound, :with => :render_404

  protect_from_forgery

  protected

  def render_404
    render :file => "public/404.html.erb", :status => 404, :layout => false
  end

  def login_required
    authenticated? || not_authorized
  end

  def not_authorized
    redirect_to login_path and return
  end

  def table_privacy_text(table)
    table.private? ? 'PRIVATE' : 'PUBLIC'
  end
  helper_method :table_privacy_text


end

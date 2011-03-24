# coding: UTF-8

class ApplicationController < ActionController::Base
  protect_from_forgery

  before_filter :browser_is_html5_compliant?

  class NoHTML5Compliant < Exception; end;

  rescue_from NoHTML5Compliant, :with => :no_html5_compliant
  rescue_from RecordNotFound, :with => :render_404

  $progress ||= {}

  include SslRequirement

  unless Rails.env.production?
    def self.ssl_required(*splat)
      false
    end
    def self.ssl_allowed(*splat)
      true
    end
  end

  protected

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

  def api_authorization_required
    authenticate!(:api_authentication)
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

  def no_html5_compliant
    render :file => "#{Rails.root}/public/HTML5.html", :status => 500, :layout => false
  end

  private
    def browser_is_html5_compliant?
      return true if request.subdomain.eql?('api')
      user_agent = request.user_agent.try(:downcase)
      unless user_agent.blank? || user_agent.match(/firefox\/4|safari\/5|chrome\/7/)
        raise NoHTML5Compliant
      end
    end

end

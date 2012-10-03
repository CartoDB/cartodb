# coding: UTF-8

class ApplicationController < ActionController::Base
  include SslRequirement
  protect_from_forgery

  helper :all

  before_filter :browser_is_html5_compliant?
  before_filter :check_domain
  after_filter :remove_flash_cookie
  before_filter :allow_cross_domain_access

  rescue_from NoHTML5Compliant, :with => :no_html5_compliant
  rescue_from RecordNotFound,   :with => :render_404

  # this disables SSL requirement in non-production environments
  unless Rails.env.production? || Rails.env.staging?
    def self.ssl_required(*splat)
      false
    end
    def self.ssl_allowed(*splat)
      true
    end
  end


  protected

  def allow_cross_domain_access
    unless Rails.env.production? || Rails.env.staging?
      response.headers["Access-Control-Allow-Origin"] = "*"
      response.headers["Access-Control-Allow-Methods"] = "*"
    end
  end

  def render_403
    respond_to do |format|
      format.html { render :file => "public/403.html", :status => 403, :layout => false }
      format.all  { head :forbidden }
    end
  end

  def render_404
    respond_to do |format|
      format.html do
        render :file => "public/404.html", :status => 404, :layout => false
      end
      format.json do
        head :not_found
      end
    end
  end

  def render_500
    render :file => "public/500.html", :status => 500, :layout => false
  end

  def login_required
    authenticated?(request.subdomain) || not_authorized
  end

  def api_authorization_required
    authenticate!(:api_key, :api_authentication, :scope => request.subdomain)
  end

  def not_authorized
    respond_to do |format|
      format.html do
        session[:return_to] = request.url
        redirect_to login_url(:host => CartoDB.account_host) and return
      end
      format.json do
        head :unauthorized
      end
    end
  end

  def check_domain
    if Rails.env.production? || Rails.env.staging?
     protocol   = 'https'
     port       = ""
    else
     protocol   = 'http'
     port       = ":#{request.port}"
    end
    app_domain = CartoDB.session_domain

    if logged_in?
      if current_user.present? and request.host !~ /^#{current_user.username}#{app_domain}$/
        redirect_to "#{protocol}://#{current_user.username}#{app_domain}#{port}"
      end
    end
  end

  def table_privacy_text(table)
    if table.is_a?(Table)
      table.private? ? 'PRIVATE' : 'PUBLIC'
    elsif table.is_a?(Hash)
      table["privacy"]
    end
  end
  helper_method :table_privacy_text

  def translate_error(exception)
    return exception if exception.is_a? String

    case exception
      when CartoDB::EmptyFile
      when CartoDB::InvalidUrl
      when CartoDB::InvalidFile
      when CartoDB::TableCopyError
      when CartoDB::QuotaExceeded
        exception.detail
      when Sequel::DatabaseError
        # TODO: rationalise these error codes
        if exception.message.include?("transform: couldn't project")
          ERROR_CODES[:geometries_error].merge(:raw_error => exception.message)
        else
          ERROR_CODES[:unknown_error].merge(:raw_error => exception.message)
        end
      else
        ERROR_CODES[:unknown_error].merge(:raw_error => exception.message)
    end.to_json
  end

  def no_html5_compliant
    logout
    render :file => "#{Rails.root}/public/HTML5.html", :status => 500, :layout => false
  end

  def api_request?
    request.subdomain == 'api'
  end

  # In some cases the flash message is going to be set in the fronted with js after making a request to the API
  # We use this filter to ensure it disappears in the very first request
  def remove_flash_cookie
    cookies.delete(:flash) if cookies[:flash]
  end

  def browser_is_html5_compliant?
    user_agent = request.user_agent.try(:downcase)

    return true if user_agent.nil?

    banned_regex = [
      /msie [0-8]\./, /safari\/[0-4][0-2][0-2]/, /opera\/[0-8].[0-7]/, /firefox\/[0-2].[0-5]/
    ]

    if banned_regex.map { |re| user_agent.match(re) }.compact.first
      raise NoHTML5Compliant
    end
  end

  def current_user
    super(request.subdomain)
  end
  protected :current_user

end

# coding: UTF-8
require_relative '../../lib/cartodb/profiler.rb'

class ApplicationController < ActionController::Base
  include ::SslRequirement
  protect_from_forgery

  helper :all

  around_filter :wrap_in_profiler

  before_filter :store_request_host
  before_filter :ensure_user_organization_valid
  before_filter :ensure_org_url_if_org_user
  before_filter :ensure_account_has_been_activated
  before_filter :browser_is_html5_compliant?
  before_filter :allow_cross_domain_access
  before_filter :set_asset_debugging
  after_filter  :remove_flash_cookie
  after_filter  :add_revision_header

  rescue_from NoHTML5Compliant, :with => :no_html5_compliant
  rescue_from RecordNotFound,   :with => :render_404

  # this disables SSL requirement in non-production environments (add "|| Rails.env.development?" for local https)
  unless Rails.env.production? || Rails.env.staging?
    def self.ssl_required(*splat)
      false
    end
    def self.ssl_allowed(*splat)
      true
    end
  end

  protected

  def is_https?
    request.protocol == 'https://'
  end

  # To be used only when domainless urls are present, to replicate sent subdomain
  def store_request_host
    return unless CartoDB.subdomainless_urls?

    match = /([\w\-\.]+)(:[\d]+)?\/?/.match(request.host.to_s)
    unless match.nil?
      CartoDB.request_host = match[1]
    end
  end

  def wrap_in_profiler
    if params[:profile_request].present? && current_user.present? && current_user.has_feature_flag?('profiler')
      CartoDB::Profiler.new().call(request) { yield }
    else
      yield
    end
  end

  def set_asset_debugging
    CartoDB::Application.config.assets.debug =
      (Cartodb.config[:debug_assets].nil? ? true : Cartodb.config[:debug_assets]) if Rails.env.development?
  end

  def allow_cross_domain_access
    unless Rails.env.production? || Rails.env.staging?
      response.headers['Access-Control-Allow-Origin'] = '*'
      response.headers['Access-Control-Allow-Methods'] = '*'
    end
  end

  def render_403
    respond_to do |format|
      format.html { render :file => 'public/403.html', :status => 403, :layout => false }
      format.all  { head :forbidden }
    end
  end

  def render_404
    respond_to do |format|
      format.html do
        render :file => 'public/404.html', :status => 404, :layout => false
      end
      format.json do
        head :not_found
      end
    end
  end

  def render_500
    format.html do
      render :file => 'public/500.html', :status => 500, :layout => false
    end
    format.json do
      render :status => 500
    end
  end

  def login_required
    authenticated?(CartoDB.extract_subdomain(request)) || not_authorized
  end

  def api_authorization_required
    authenticate!(:api_key, :api_authentication, :scope => CartoDB.extract_subdomain(request))
  end

  def not_authorized
    respond_to do |format|
      format.html do
        session[:return_to] = request.url
        redirect_to CartoDB.path(self, 'login') and return
      end
      format.json do
        head :unauthorized
      end
    end
  end

  def table_privacy_text(table)
    if table.is_a?(::Table)
      table.privacy_text
    elsif table.is_a?(Hash)
      table['privacy']
    end
  end
  helper_method :table_privacy_text

  # TODO: Move to own exception infrastructure
  def translate_error(exception)
    return exception if exception.blank? || exception.is_a?(String)

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
          Cartodb.error_codes[:geometries_error].merge(:raw_error => exception.message)
        else
          Cartodb.error_codes[:unknown_error].merge(:raw_error => exception.message)
        end
      else
        Cartodb.error_codes[:unknown_error].merge(:raw_error => exception.message)
    end.to_json
  end

  def no_html5_compliant
    logout
    render :file => "#{Rails.root}/public/HTML5.html", :status => 500, :layout => false
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
      /msie [0-9]\./, /safari\/[0-4][0-2][0-2]/, /opera\/[0-8].[0-7]/, /firefox\/[0-2].[0-5]/
    ]

    if banned_regex.map { |re| user_agent.match(re) }.compact.first
      raise NoHTML5Compliant
    end
  end

  def ensure_user_organization_valid
    return if CartoDB.subdomainless_urls?

    org_subdomain = CartoDB.extract_host_subdomain(request)
    unless org_subdomain.nil? || current_user.nil?
      if current_user.organization.nil? || current_user.organization.name != org_subdomain
        render_404
      end
    end
  end

  # By default, override Admin urls unless :dont_rewrite param is present
  def ensure_org_url_if_org_user
    return if CartoDB.subdomainless_urls?

    rewrite_url = !request.params[:dont_rewrite].present?
    if rewrite_url && !current_user.nil? && !current_user.organization.nil? &&
        CartoDB.subdomain_from_request(request) == current_user.username
      if request.fullpath == '/'
        redirect_to CartoDB.url(self, 'dashboard')
      else
        redirect_to CartoDB.base_url(current_user.organization.name, current_user.username) << request.fullpath
      end
    end
  end

  def ensure_account_has_been_activated
    return unless current_user

    redirect_to CartoDB.url(self, 'account_token_authentication_error') unless current_user.enable_account_token.nil?
  end

  def add_revision_header
    response.headers['X-CartoDB-Rev'] = CartoDB::CARTODB_REV unless CartoDB::CARTODB_REV.nil?
  end

  def current_user
    super(CartoDB.extract_subdomain(request))
  end

  # current_user relies on request subdomain ALWAYS, so current_viewer will always return:
  # - If subdomain is present in the sessions: subdomain-based session (aka current_user)
  # - Else: the first session found at request.session that comes from warden
  def current_viewer
    if @current_viewer.nil?
      if current_user && env["warden"].authenticated?(current_user.username)
        @current_viewer = current_user
      else
        authenticated_usernames = request.session.select {|k,v| k.start_with?("warden.user")}.values
        current_user_present = authenticated_usernames.select { |username|
          CartoDB.extract_subdomain(request) == username
        }.first

        if current_user_present.nil?
          authenticated_username = authenticated_usernames.first
          @current_viewer = authenticated_username.nil? ? nil : User.where(username: authenticated_username).first
        end
      end
    end
    @current_viewer
  end

  protected :current_user

end

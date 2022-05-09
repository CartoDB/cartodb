require_relative '../../lib/cartodb/profiler.rb'
require_dependency 'carto/authentication_manager'
require_dependency 'carto/http_header_authentication'

class ApplicationController < ActionController::Base

  include UrlHelper
  include Carto::ControllerHelper
  include Carto::Common::ControllerHelper
  include ::LoggerControllerHelper

  protect_from_forgery

  helper :all

  around_filter :wrap_in_profiler
  around_action :set_request_id

  before_filter :set_security_headers
  before_filter :http_header_authentication, if: :http_header_authentication?
  before_filter :store_request_host
  before_filter :ensure_user_organization_valid
  before_filter :ensure_org_url_if_org_user
  before_filter :ensure_account_has_been_activated
  before_filter :browser_is_html5_compliant?
  before_filter :set_asset_debugging
  before_filter :cors_preflight_check
  before_filter :check_maintenance_mode
  before_filter :check_user_state
  after_filter  :allow_cross_domain_access
  after_filter  :remove_flash_cookie
  after_filter  :add_revision_header

  rescue_from NoHTML5Compliant, :with => :no_html5_compliant
  rescue_from ActiveRecord::RecordNotFound, RecordNotFound, with: :render_404
  rescue_from Carto::ExpiredSessionError, with: :rescue_from_carto_error

  ME_ENDPOINT_COOKIE = :_cartodb_base_url
  IGNORE_PATHS_FOR_CHECK_USER_STATE = %w(unverified maintenance_mode lockout login logout unauthenticated multifactor_authentication).freeze

  def self.ssl_required(*splat)
    if Cartodb.config[:ssl_required] == true
      if splat.any?
        force_ssl only: splat
      else
        force_ssl
      end
    end
  end

  def self.ssl_allowed(*_splat)
    # noop
  end

  # current_user relies on request subdomain ALWAYS, so current_viewer will always return:
  # - If subdomain is present in the sessions: subdomain-based session (aka current_user)
  # - Else: the first session found at request.session that comes from warden
  def current_viewer
    if @current_viewer.nil?
      if current_user && env["warden"].authenticated?(current_user.username)
        @current_viewer = current_user if Carto::AuthenticationManager.validate_session(warden, request, current_user)
      else
        authenticated_usernames = request.session.to_hash.select { |k, _|
          k.start_with?("warden.user") && !k.end_with?(".session")
        }.values
        # See if there's a session of the viewed subdomain corresponding user
        current_user_present = authenticated_usernames.select { |username|
          CartoDB.extract_subdomain(request) == username
        }.first

        # If current user session was there, do nothing; else, retrieve first available
        if current_user_present.nil?
          unless authenticated_usernames.first.nil?
            user = Carto::User.find_by(username: authenticated_usernames.first)
            Carto::AuthenticationManager.validate_session(warden, request, user) unless user.nil?
            @current_viewer = user
          end
        end
      end
    end
    @current_viewer
  rescue Carto::ExpiredSessionError => e
    request.reset_session
    current_user.try(:invalidate_all_sessions!)
    not_authorized(e)
  end

  protected

  Warden::Manager.after_authentication do |user, auth, opts|
    auth.cookies.permanent[ME_ENDPOINT_COOKIE] = {
      value: CartoDB.base_url(user.username),
      domain: Cartodb.config[:session_domain]
    } if opts[:store]

    # Do not even send the Set-Cookie header if the strategy did not store anything in the session
    auth.request.session_options[:skip] = true if opts[:store] == false
  end

  Warden::Manager.before_logout do |user, auth, opts|
    if user.present?
      user.invalidate_all_sessions!
    elsif opts[:scope]
      scope_user = Carto::User.find_by(username: opts[:scope])
      scope_user&.invalidate_all_sessions!
    end
    auth.cookies.delete(ME_ENDPOINT_COOKIE, domain: Cartodb.config[:session_domain])
  end

  def handle_unverified_request
    render_403
  end

  # @see Warden::Manager.after_set_user
  def update_session_security_token(user)
    warden.session(user.username)[:sec_token] = user.security_token
  end

  def is_https?
    request.protocol == 'https://'
  end

  def http_header_authentication
    authenticate(:http_header_authentication, scope: CartoDB.extract_subdomain(request))
    if current_user
      Carto::AuthenticationManager.validate_session(warden, request, current_user)
    else
      authenticator = Carto::HttpHeaderAuthentication.new
      if authenticator.autocreation_enabled?
        if authenticator.creation_in_progress?(request)
          redirect_to CartoDB.path(self, 'signup_http_authentication_in_progress')
        else
          redirect_to CartoDB.path(self, 'signup_http_authentication')
        end
      end
    end
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
      CartoDB::Profiler.new().call(request, response) { yield }
    else
      yield
    end
  end

  def set_asset_debugging
    CartoDB::Application.config.assets.debug =
      (Cartodb.config[:debug_assets].nil? ? true : Cartodb.config[:debug_assets]) if Rails.env.development?
  end

  def cors_preflight_check
    if request.method == :options && check_cors_headers_for_whitelisted_origin
      common_cors_headers
      response.headers['Access-Control-Max-Age'] = '3600'
    elsif !Rails.env.production?
      development_cors_headers
    end
  end

  def allow_cross_domain_access
    if !request.headers['origin'].blank? && check_cors_headers_for_whitelisted_origin
      common_cors_headers
      response.headers['Access-Control-Allow-Credentials'] = 'true'
    elsif !Rails.env.production? && !Rails.env.staging?
      development_cors_headers
    end
  end

  def common_cors_headers
    response.headers['Access-Control-Allow-Origin'] = request.headers['origin']
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, DELETE'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
  end

  def development_cors_headers
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = '*'
    response.headers['Access-Control-Allow-Headers'] = '*'
  end

  def check_cors_headers_for_whitelisted_origin
    origin = request.headers['origin']

    cors_enabled_hosts = Cartodb.get_config(:cors_enabled_hosts) || []
    allowed_hosts = ([Cartodb.config[:account_host]] + cors_enabled_hosts).compact

    allowed_hosts.include?(URI.parse(origin).host)
  end

  def check_user_state
    return if IGNORE_PATHS_FOR_CHECK_USER_STATE.any? { |path| request.path.end_with?("/" + path) }
    viewed_username = CartoDB.extract_subdomain(request)
    if current_user.nil? || current_user.username != viewed_username
      user = Carto::User.find_by_username(viewed_username)
      if user.try(:locked?)
        render_locked_owner
        return
      end
      if user.try(:pending_verification?)
        render_unverified_user
        return
      end
    elsif current_user.try(:pending_verification?)
      render_unverified_user
      return
    elsif current_user.locked?
      render_locked_user
      return
    elsif current_user.unverified?
      render_unverified_user
      return
    end

    render_multifactor_authentication if multifactor_authentication_required?
  end

  def check_maintenance_mode
    return if IGNORE_PATHS_FOR_CHECK_USER_STATE.any? { |path| request.path.end_with?("/" + path) }

    viewed_username = CartoDB.extract_subdomain(request)
    if current_user.nil? || current_user.username != viewed_username
      user = Carto::User.find_by_username(viewed_username)
      if user.try(:maintenance_mode?)
        render_locked_owner
        return
      end
    elsif current_user.maintenance_mode?
      render_maintenance_mode
      return
    end
  end

  def render_403
    respond_to do |format|
      format.html { render(file: 'public/403.html', status: 403, layout: false) }
      format.all  { head(:forbidden) }
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
    render_http_code(500)
  end

  def render_http_code(error_code, public_page_error_code = error_code, error_message = 'Unknown error')
    respond_to do |format|
      format.html do
        render file: "public/#{public_page_error_code}.html", status: error_code, layout: false
      end
      format.json do
        render json: { error_message: error_message }, status: error_code
      end
    end
  end

  def multifactor_authentication_required?(user = current_viewer)
    user&.multifactor_authentication_configured? &&
      !warden.session(user.username)[:multifactor_authentication_performed] &&
      !warden.session(user.username)[:skip_multifactor_authentication]
  rescue Warden::NotAuthenticated
    false
  end

  def login_required
    is_auth = authenticated?(CartoDB.extract_subdomain(request))
    is_auth ? Carto::AuthenticationManager.validate_session(warden, request, current_user) : not_authorized
  end

  def login_required_any_user
    current_viewer ? Carto::AuthenticationManager.validate_session(warden, request, current_viewer) : not_authorized
  end

  def api_authorization_required
    authenticate!(:auth_api, :api_authentication, scope: CartoDB.extract_subdomain(request))
    Carto::AuthenticationManager.validate_session(warden, request, current_user)
  end

  def any_api_authorization_required
    authenticate!(:any_auth_api, :api_authentication, scope: CartoDB.extract_subdomain(request))
    Carto::AuthenticationManager.validate_session(warden, request, current_user)
  end

  def engine_required
    render_404 unless current_viewer.try(:engine_enabled?)
  end

  # This only allows to authenticate if sending an API request to username.api_key subdomain,
  # but doesn't break the request if can't authenticate
  def optional_api_authorization
    got_auth = authenticate(:auth_api, :api_authentication, scope: CartoDB.extract_subdomain(request))
    Carto::AuthenticationManager.validate_session(warden, request, current_user) if got_auth
  rescue Carto::ExpiredSessionError => e
    not_authorized(e)
  end

  def redirect_or_forbidden(path, error)
    respond_to do |format|
      format.html do
        redirect_to CartoDB.url(self, path)
      end
      format.json do
        render(json: { error: error }, status: 403)
      end
    end
  end

  def render_multifactor_authentication
    session[:return_to] = request.original_url
    redirect_or_forbidden('multifactor_authentication_session', 'mfa_required')
  end

  def render_unverified_user
    redirect_or_forbidden('unverified', 'unverified')
  end

  def render_locked_user
    redirect_or_forbidden('lockout', 'lockout')
  end

  def render_maintenance_mode
    redirect_or_forbidden('maintenance_mode', 'maintenance_mode')
  end

  def render_locked_owner
    respond_to do |format|
      format.html do
        render_404
      end
      format.json do
        head 404
      end
    end
  end

  def not_authorized(exception = nil)
    respond_to do |format|
      format.html do
        session[:return_to] = request.url
        redirect_to CartoDB.url(self, 'login', keep_base_url: true)
        return
      end
      format.json do
        render(json: { errors: exception&.message }, status: :unauthorized)
        return
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
      /msie [0-9]\./, /safari\/[0-4][0-2][0-2]/, /opera\/[0-8].[0-7]/, /firefox\/[0-2]\.[0-5]/
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

    if !current_user.enable_account_token.nil?
      respond_to do |format|
        format.html {
          redirect_to CartoDB.url(self, 'account_token_authentication_error')
        }
        format.all  {
          head :forbidden
        }
      end
    end
  end

  def add_revision_header
    response.headers['X-CartoDB-Rev'] = CartoDB::CARTODB_REV unless CartoDB::CARTODB_REV.nil?
  end

  def current_user
    super(CartoDB.extract_subdomain(request))
  end

  def update_user_last_activity
    return false if current_user.nil?
    current_user.set_last_active_time
    current_user.set_last_ip_address request.remote_ip
  end

  def ensure_required_params(required_params, status = 400)
    params_with_value = params.reject { |_, v| v.empty? }
    missing_params = required_params - params_with_value.keys
    raise Carto::MissingParamsError.new(missing_params, status) unless missing_params.empty?
  end

  def ensure_required_request_params(required_params, status = 422)
    params_with_value = request.request_parameters.reject { |_, v| v.empty? }
    missing_params = required_params - params_with_value.keys
    raise Carto::UnprocesableEntityError.new("Missing parameter: #{missing_params}", status) unless missing_params.empty?
  end

  def ensure_no_extra_request_params(allowed_params, status = 422)
    params_with_value = request.request_parameters.reject { |_, v| v.empty? }
    extra_params = params_with_value.keys - allowed_params
    raise Carto::UnprocesableEntityError.new("Invalid parameter: #{extra_params}", status) unless extra_params.empty?
  end

  protected :current_user

  def json_formatted_request?
    format = request.format

    format.json? || (format.nil? && request.accepts.first.json?)
  end

  private

  def http_header_authentication?
    Carto::HttpHeaderAuthentication.new.valid?(request)
  end

  def set_security_headers
    headers['X-Frame-Options'] = 'DENY'
    headers['X-XSS-Protection'] = '1; mode=block'
    headers['X-Content-Type-Options'] = 'nosniff'
  end

end

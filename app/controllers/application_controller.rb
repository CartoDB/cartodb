# coding: UTF-8

class ApplicationController < ActionController::Base
  protect_from_forgery
  helper :all

  before_filter :browser_is_html5_compliant?, :app_host_required

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
  
  def access_token
    return nil unless logged_in?
    access_token = nil
    consumer = OAuth::Consumer.new(current_user.client_application.key, current_user.client_application.secret, :site => APP_CONFIG[:api_host])
    if !session[:access_token].blank? && !session[:access_token_secret].blank?
      access_token = OAuth::AccessToken.new(consumer, session[:access_token], session[:access_token_secret])
    end
    unless access_token
      request_token = consumer.get_request_token
      uri = URI.parse(request_token.authorize_url)
      http = Net::HTTP.new(uri.host, uri.port)
      if Rails.env.production?
        http.use_ssl = true
        http.verify_mode = OpenSSL::SSL::VERIFY_NONE
      end
      request = Net::HTTP::Post.new(uri.request_uri, {'authorize' => '1', 'oauth_token' => request_token.token})
      request.set_form_data({'foo' => 'bar'}, ';') # Hack to avoid 401 LengthRequired
      res = http.request(request)
      url = URI.parse(res.header['location'])
      verifier = url.query.split('&').select{ |q| q =~ /^oauth_verifier/}.first.split('=')[1]
      access_token = request_token.get_access_token(:oauth_verifier => verifier)
      session[:access_token] = access_token.token
      session[:access_token_secret] = access_token.secret
    end
    access_token
  end

  protected
  
  def app_host_required
    (request.host_with_port == APP_CONFIG[:app_host].host) || (render_api_endpoint and return false)
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
  
  def render_500
    respond_to do |format|
      format.html do
        render :file => "public/500.html", :status => 500, :layout => false
      end
    end
  end

  def render_api_endpoint
    respond_to do |format|
      format.html do
        render :file => "public/api.html.erb", :status => 404, :layout => false
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
    if table.is_a?(Table)
      table.private? ? 'PRIVATE' : 'PUBLIC'
    elsif table.is_a?(Hash)
      table["privacy"]
    end
  end
  helper_method :table_privacy_text

  def translate_error(exception)
    if exception.is_a?(String)
      return exception
    end
    case exception
      when CartoDB::EmtpyFile
        ERROR_CODES[:empty_file]
      when Sequel::DatabaseError
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
    render :file => "#{Rails.root}/public/HTML5.html", :status => 500, :layout => false
  end

  def api_request?
    request.subdomain.eql?('api')
  end
  
  def browser_is_html5_compliant?
    return true if Rails.env.test? || api_request?
    user_agent = request.user_agent.try(:downcase)
    return true if user_agent.nil?
    if user_agent.match(/msie/) && !user_agent.match(/9\.0/)
      raise NoHTML5Compliant
    end
  end
  
end

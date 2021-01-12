class Superadmin::SuperadminController < ActionController::Base

  include Carto::ControllerHelper
  include Carto::Common::ControllerHelper
  include ::LoggerControllerHelper

  before_filter :authenticate
  around_action :set_request_id

  rescue_from StandardError, with: :rescue_from_superadmin_error

  def self.ssl_required(*splat)
    if Cartodb.config[:ssl_required] == true
      force_ssl only: splat
    end
  end

  def self.ssl_allowed(*_splat)
    # noop
  end

  protected

  def authenticate
    return true if Rails.env.development? || authenticated?(CartoDB.extract_subdomain(request)) && current_user.admin
    authenticate_or_request_with_http_basic do |username, password|
      username == Cartodb.get_config(:superadmin, 'username') && password == Cartodb.get_config(:superadmin, 'password')
    end
  end

  def current_user
    super(CartoDB.extract_subdomain(request))
  end

  private

  def rescue_from_superadmin_error(error)
    log_rescue_from(__method__, error)
    log_error(exception: error)
    render(json: { errors: { message: error.inspect, backtrace: error.backtrace.inspect } }, status: 500)
  end
end

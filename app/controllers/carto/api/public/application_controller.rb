class Carto::Api::Public::ApplicationController < ::Api::ApplicationController
  include Carto::Api::AuthApiAuthentication

  skip_before_action :cors_preflight_check, :allow_cross_domain_access
  before_action :allow_full_cross_domain_access

  skip_before_action :http_header_authentication
  skip_before_action :api_authorization_required
  before_action :only_api_key_authorization

  WARDEN_SCOPE = :public_api_scope

  def allow_full_cross_domain_access
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Authorization'
  end

  def current_user
    request_api_key.user
  end

  def current_viewer
    current_user
  end

  private

  def only_api_key_authorization
    authenticate!(:any_auth_api, :api_authentication, scope: WARDEN_SCOPE)
    validate_session(current_user)
  end
end

class Carto::Api::Public::ApplicationController < ::Api::ApplicationController
  include Carto::Api::AuthApiAuthentication

  # Override all CORS settings
  skip_before_action :cors_preflight_check
  skip_after_action :allow_cross_domain_access
  before_action :allow_full_cross_domain_access

  # Only allow API Key authorization
  skip_before_action :http_header_authentication, :api_authorization_required
  prepend_before_action :only_api_key_authorization

  # Disable authorization check for OPTIONS
  skip_before_action :only_api_key_authorization, only: [:options]

  WARDEN_SCOPE = :$public_api_scope

  def allow_full_cross_domain_access
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type'
  end

  def options
    head :ok
  end

  # Override current_user and current_viewer so they only return the user authenticated via API Key (ignore session)
  def current_user
    warden.user(WARDEN_SCOPE)
  end

  def current_viewer
    current_user
  end

  private

  def only_api_key_authorization
    authenticate!(:any_auth_api, :api_authentication, scope: WARDEN_SCOPE)
  end
end

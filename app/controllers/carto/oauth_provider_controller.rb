# encoding: UTF-8

require_dependency 'carto/oauth_provider/errors'

module Carto
  class OauthProviderController < ApplicationController
    SUPPORTED_GRANT_TYPES = ['authorization_code'].freeze
    SUPPORTED_RESPONSE_TYPES = ['code'].freeze

    ssl_required

    layout 'frontend'

    skip_before_action :ensure_org_url_if_org_user
    skip_before_action :verify_authenticity_token, only: [:token]

    before_action :login_required, only: [:consent, :authorize]
    before_action :set_redirection_error_handling, only: [:consent, :authorize]
    before_action :load_oauth_app, :verify_redirect_uri
    before_action :validate_response_type, :validate_scopes, :ensure_state, only: [:consent, :authorize]
    before_action :load_oauth_app_user, only: [:consent, :authorize]
    before_action :validate_grant_type, :verify_client_secret, only: [:token]
    before_action :load_authorization_code, :verify_authorization_code_redirect_uri, only: [:token]

    rescue_from StandardError, with: :rescue_generic_errors
    rescue_from OauthProvider::Errors::BaseError, with: :rescue_oauth_errors

    def consent
      return create_authorization_code if @oauth_app_user.try(:authorized?, @scopes)
    end

    def authorize
      raise OauthProvider::Errors::AccessDenied.new unless params[:accept]

      if @oauth_app_user
        @oauth_app_user.upgrade!(@scopes)
      else
        @oauth_app_user = @oauth_app.oauth_app_users.create!(user_id: current_user.id, scopes: @scopes)
      end

      create_authorization_code
    end

    def token
      access_token = @authorization_code.exchange!

      response = {
        access_token: access_token.api_key.token,
        token_type: 'bearer'
        # expires_in: seconds
        # refresh_token:
      }

      render(json: response)
    end

    private

    def create_authorization_code
      authorization_code = @oauth_app_user.oauth_authorization_codes.create!(redirect_uri: @redirect_uri)
      redirect_to_oauth_app(code: authorization_code.code, state: @state)
    end

    def redirect_to_oauth_app(parameters)
      redirect_uri = Addressable::URI.parse(@redirect_uri || @oauth_app.redirect_uris.first)
      query = redirect_uri.query_values || {}
      redirect_uri.query_values = query.merge(parameters)

      redirect_to redirect_uri.to_s
    end

    def set_redirection_error_handling
      @redirect_on_error = true
    end

    def rescue_oauth_errors(exception)
      CartoDB::Logger.debug(message: 'Oauth provider error',
                            exception: exception,
                            redirect_on_error: @redirect_on_error,
                            oauth_app: @oauth_app)

      if @redirect_on_error && @oauth_app
        redirect_to_oauth_app(exception.parameters.merge(state: @state))
      elsif @redirect_on_error
        render_404
      else
        render json: exception.parameters, status: 400
      end
    end

    def rescue_generic_errors(exception)
      CartoDB::Logger.error(exception: exception)
      rescue_oauth_errors(OauthProvider::Errors::ServerError.new)
    end

    def validate_response_type
      @response_type = params[:response_type]
      unless SUPPORTED_RESPONSE_TYPES.include?(@response_type)
        raise OauthProvider::Errors::UnsupportedResponseType.new(SUPPORTED_RESPONSE_TYPES)
      end
    end

    def validate_grant_type
      unless SUPPORTED_GRANT_TYPES.include?(params[:grant_type])
        raise OauthProvider::Errors::UnsupportedGrantType.new(SUPPORTED_GRANT_TYPES)
      end
    end

    def load_oauth_app
      @oauth_app = OauthApp.find_by_client_id!(params[:client_id])
    rescue ActiveRecord::RecordNotFound
      raise OauthProvider::Errors::InvalidClient.new
    end

    def verify_redirect_uri
      # Redirect URI is optional but, if present, must match a registered URI
      @redirect_uri = params[:redirect_uri].presence
      if @redirect_uri.present? && !@oauth_app.redirect_uris.include?(@redirect_uri)
        @redirect_uri = nil
        raise OauthProvider::Errors::InvalidRequest.new('The redirect_uri is not authorized for this application')
      end
    end

    def validate_scopes
      @scopes = (params[:scope] || '').split(' ')
      raise OauthProvider::Errors::InvalidScope.new(@scopes) if @scopes.any?
    end

    def ensure_state
      @state = params[:state]
      raise OauthProvider::Errors::InvalidRequest.new('state is mandatory') unless @state.present?
    end

    def load_oauth_app_user
      @oauth_app_user = @oauth_app.oauth_app_users.find_by_user_id(current_user.id)
    end

    def load_authorization_code
      @authorization_code = OauthAuthorizationCode.find_by_code!(params[:code])
      raise OauthProvider::Errors::InvalidGrant.new unless @authorization_code.oauth_app_user.oauth_app == @oauth_app
    rescue ActiveRecord::RecordNotFound
      raise OauthProvider::Errors::InvalidGrant.new
    end

    def verify_client_secret
      raise OauthProvider::Errors::InvalidClient.new unless params[:client_secret] == @oauth_app.client_secret
    end

    def verify_authorization_code_redirect_uri
      # Redirect URI must match what was specified during authorization
      if (@redirect_uri || @authorization_code.redirect_uri) && @redirect_uri != @authorization_code.redirect_uri
        raise OauthProvider::Errors::InvalidRequest.new('The redirect_uri must match the authorization request')
      end
    end
  end
end

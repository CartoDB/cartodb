# encoding: UTF-8

require_dependency 'carto/oauth_provider/errors'
require_dependency 'carto/oauth_provider/strategies'

module Carto
  class OauthProviderController < ApplicationController
    GRANT_STRATEGIES = {
      'authorization_code' => OauthProvider::Strategies::AuthorizationCodeStrategy,
      'refresh_token' => OauthProvider::Strategies::RefreshTokenStrategy
    }.freeze
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

    rescue_from StandardError, with: :rescue_generic_errors
    rescue_from OauthProvider::Errors::BaseError, with: :rescue_oauth_errors

    def consent
      return create_authorization_code if @oauth_app_user.try(:authorized?, @scopes)

      @scopes_by_category = OauthProvider::Scopes.scopes_by_category(@scopes, @oauth_app_user.try(:scopes))
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
      access_token, refresh_token = grant_strategy.authorize!(@oauth_app, params)
      user = access_token.oauth_app_user.user

      response = {
        access_token: access_token.api_key.token,
        token_type: 'bearer',
        expires_in: access_token.expires_in,
        user_info_url: CartoDB.url(self, :api_v4_users_me, {}, user)
      }

      response[:refresh_token] = refresh_token.token if refresh_token

      render(json: response)
    end

    private

    def create_authorization_code
      authorization_code = @oauth_app_user.oauth_authorization_codes.create!(
        redirect_uri: @redirect_uri, scopes: @scopes
      )
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
        @error = exception.error_message
        render 'consent.html', status: 400
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
      raise OauthProvider::Errors::UnsupportedGrantType.new(GRANT_STRATEGIES.keys) unless grant_strategy
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

      invalid_scopes = OauthProvider::Scopes.invalid_scopes(@scopes)
      raise OauthProvider::Errors::InvalidScope.new(invalid_scopes) if invalid_scopes.present?
    end

    def ensure_state
      @state = params[:state]
      raise OauthProvider::Errors::InvalidRequest.new('state is mandatory') unless @state.present?
    end

    def load_oauth_app_user
      @oauth_app_user = @oauth_app.oauth_app_users.find_by_user_id(current_user.id)
    end

    def verify_client_secret
      raise OauthProvider::Errors::InvalidClient.new unless params[:client_secret] == @oauth_app.client_secret
    end

    def grant_strategy
      GRANT_STRATEGIES[params[:grant_type]]
    end
  end
end

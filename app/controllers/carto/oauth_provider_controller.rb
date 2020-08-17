require_dependency 'carto/errors'
require_dependency 'carto/oauth_provider/errors'
require_dependency 'carto/oauth_provider/grant_strategies'
require_dependency 'carto/oauth_provider/response_strategies'
require_dependency 'carto/oauth_provider/token_presenter'
require_dependency 'carto/helpers/frame_options_helper'

module Carto
  class OauthProviderController < ApplicationController
    include Carto::FrameOptionsHelper

    GRANT_STRATEGIES = {
      'authorization_code' => OauthProvider::GrantStrategies::AuthorizationCodeStrategy,
      'refresh_token' => OauthProvider::GrantStrategies::RefreshTokenStrategy
    }.freeze

    RESPONSE_STRATEGIES = {
      'code' => OauthProvider::ResponseStrategies::CodeStrategy,
      'token' => OauthProvider::ResponseStrategies::TokenStrategy
    }.freeze

    REQUIRED_TOKEN_PARAMS = ['client_id', 'client_secret', 'grant_type'].freeze
    REQUIRED_AUTHORIZE_PARAMS = ['client_id', 'state', 'response_type'].freeze

    SILENT_PROMPT_VALUE = 'none'.freeze

    ssl_required

    layout 'frontend'

    skip_before_action :ensure_org_url_if_org_user
    skip_before_action :verify_authenticity_token, only: [:token]

    before_action :x_frame_options_allow, only: :consent, if: :silent_flow?
    before_action :set_redirection_error_handling, :set_state, only: [:consent, :authorize]
    before_action :ensure_required_token_params, only: [:token]
    before_action :load_oauth_app, :verify_redirect_uri
    before_action :login_required_any_user, only: [:consent, :authorize]
    before_action :validate_prompt_request, only: [:consent]
    before_action :reject_client_secret, only: [:consent, :authorize]
    before_action :ensure_required_authorize_params, only: [:consent, :authorize]
    before_action :validate_response_type, :validate_scopes, only: [:consent, :authorize]
    before_action :load_oauth_app_user, only: [:consent, :authorize]
    before_action :validate_grant_type, :verify_client_secret, only: [:token]

    rescue_from StandardError, with: :rescue_generic_errors
    rescue_from Carto::MissingParamsError, with: :rescue_missing_params_error
    rescue_from OauthProvider::Errors::BaseError, with: :rescue_oauth_errors

    def consent
      return create_authorization_code if @oauth_app_user.try(:authorized?, @scopes)
      raise OauthProvider::Errors::AccessDenied.new if silent_flow?

      unless @oauth_app_user
        oauth_app_user = @oauth_app.oauth_app_users.new(user_id: current_viewer.id, scopes: @scopes)
        validate_oauth_app_user(oauth_app_user)
      end

      @scopes_by_category = OauthProvider::Scopes.scopes_by_category(@scopes, @oauth_app_user.try(:all_scopes))
    end

    def authorize
      raise OauthProvider::Errors::AccessDenied.new unless params[:accept]

      if @oauth_app_user
        @oauth_app_user.upgrade!(@scopes)
      else
        @oauth_app_user = @oauth_app.oauth_app_users.new(user_id: current_viewer.id, scopes: @scopes)
        validate_oauth_app_user(@oauth_app_user)
        @oauth_app_user.save!
        track_event
      end

      create_authorization_code
    end

    def token
      access_token, refresh_token = grant_strategy.authorize!(@oauth_app, params)

      render(json: OauthProvider::TokenPresenter.new(access_token, refresh_token: refresh_token).to_hash)
    end

    def not_authorized(exception = nil)
      raise OauthProvider::Errors::LoginRequired.new if silent_flow?

      super
    end

    private

    def create_authorization_code
      response = response_strategy.authorize!(
        @oauth_app_user, redirect_uri: @redirect_uri, scopes: @scopes, state: @state
      )
      redirect_to_oauth_app(response)
    end

    def redirect_to_oauth_app(parameters)
      redirect_to response_strategy.build_redirect_uri(@redirect_uri || @oauth_app.redirect_uris.first, parameters)
    end

    def set_redirection_error_handling
      @redirect_on_error = true
    end

    def rescue_oauth_errors(exception)
      log_rescue_from(__method__, exception)
      log_warning(
        message: 'Oauth provider error', exception: exception,
        redirect_on_error: @redirect_on_error, oauth_app: @oauth_app&.attributes&.slice(:id, :name)
      )

      if @redirect_on_error && @oauth_app && response_strategy
        redirect_to_oauth_app(exception.parameters.merge(state: @state))
      elsif @redirect_on_error
        @error = exception.error_message
        render 'consent.html', status: 400
      else
        render json: exception.parameters, status: 400
      end
    end

    def rescue_generic_errors(exception)
      log_rescue_from(__method__, exception)

      if exception.is_a?(Carto::RelationDoesNotExistError)
        return rescue_oauth_errors(OauthProvider::Errors::InvalidScope.new(nil, message: exception.user_message))
      end

      rescue_oauth_errors(OauthProvider::Errors::ServerError.new)
    end

    def rescue_missing_params_error(exception)
      log_rescue_from(__method__, exception)

      rescue_oauth_errors(OauthProvider::Errors::InvalidRequest.new(exception.message))
    end

    def validate_response_type
      @response_type = params[:response_type]

      raise OauthProvider::Errors::UnsupportedResponseType.new(RESPONSE_STRATEGIES.keys) unless response_strategy
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
        raise OauthProvider::Errors::InvalidRequest.new('The redirect_uri must match the redirect_uri param used in the authorization request')
      end
    end

    def validate_scopes
      @scopes = (params[:scope] || '').split(' ')

      invalid_scopes = OauthProvider::Scopes.invalid_scopes_and_tables(@scopes, current_viewer)
      raise OauthProvider::Errors::InvalidScope.new(invalid_scopes) if invalid_scopes.present?
    end

    def set_state
      @state = params[:state]
    end

    def load_oauth_app_user
      @oauth_app_user = @oauth_app.oauth_app_users.find_by_user_id(current_viewer.try(:id))
    end

    def verify_client_secret
      raise OauthProvider::Errors::InvalidClient.new unless params[:client_secret] == @oauth_app.client_secret
    end

    def ensure_required_token_params
      grant_params = grant_strategy.try(:required_params) || []
      ensure_required_params(REQUIRED_TOKEN_PARAMS + grant_params)
    end

    def ensure_required_authorize_params
      ensure_required_params(REQUIRED_AUTHORIZE_PARAMS)
    end

    def reject_client_secret
      raise OauthProvider::Errors::InvalidRequest.new("The client_secret param must not be sent in the authorize request") if params[:client_secret].present?
    end

    def validate_oauth_app_user(oauth_app_user)
      unless oauth_app_user.valid?
        errors = oauth_app_user.errors.full_messages_for(:user)
        raise OauthProvider::Errors::AccessDenied.new(errors.join(', ')) if errors.present?
      end
    end

    def validate_prompt_request
      if params[:prompt].present?
        raise OauthProvider::Errors::InvalidRequest.new("Only 'prompt=none' is supported") unless silent_flow?
      end
    end

    def silent_flow?
      params[:prompt] == SILENT_PROMPT_VALUE
    end

    def grant_strategy
      GRANT_STRATEGIES[params[:grant_type]]
    end

    def response_strategy
      RESPONSE_STRATEGIES[params[:response_type]]
    end

    def track_event
      properties = {
        user_id: @oauth_app_user.user_id,
        app_id: @oauth_app_user.oauth_app.id,
        app_name: @oauth_app_user.oauth_app.name
      }
      Carto::Tracking::Events::CreatedOauthAppUser.new(current_viewer.id, properties).report
    end
  end
end

# encoding: UTF-8

require_dependency 'carto/oauth_provider/errors'

module Carto
  class OauthProviderController < ApplicationController
    SUPPORTED_GRANT_TYPES = ['authorization_code'].freeze
    SUPPORTED_RESPONSE_TYPES = ['code'].freeze

    ssl_required

    layout 'frontend'

    before_action :set_redirection_error_handling, only: [:consent, :authorize]
    before_action :load_oauth_app, :verify_redirect_uri
    before_action :validate_response_type, :validate_scopes, :ensure_state, only: [:consent, :authorize]
    before_action :validate_grant_type, only: [:token]

    rescue_from OauthProvider::Errors::BaseError, with: :rescue_oauth_errors

    def consent; end

    def authorize
      # TODO
      raise OauthProvider::Errors::AccessDenied.new unless params[:accept]

      redirect_to_oauth_app(code: 'wadus', state: @state)
    end

    def token
      # TODO
      # Input
      # grant_type == authorization_code
      # code =
      # redirect_uri
      # client_id

      # Out
      # {
      #   "access_token":"87as6das87tdy",
      #   "token_type":"api_key",
      # }
    end

    private

    def redirect_to_oauth_app(parameters)
      redirect_uri = Addressable::URI.parse(@oauth_app.redirect_uri)
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
        redirect_to_oauth_app(exception.parameters)
      elsif @redirect_on_error
        render_404
      else
        render json: exception.parameters, status: 400
      end
    end

    def validate_response_type
      @response_type = params[:response_type]
      unless SUPPORTED_RESPONSE_TYPES.include?(@response_type)
        raise OauthProvider::Errors::UnsupportedResponseType.new(SUPPORTED_RESPONSE_TYPES)
      end
    end

    def validate_grant_type
      unless SUPPORTED_GRANT_TYPES.include?('authorization_code')
        raise OauthProvider::Errors::UnsupportedGrantType.new(SUPPORTED_GRANT_TYPES)
      end
    end

    def load_oauth_app
      @oauth_app = OauthApp.find_by_client_id!(params[:client_id])
    rescue ActiveRecord::RecordNotFound
      raise OauthProvider::Errors::InvalidRequest.new('Client ID not found')
    end

    def verify_redirect_uri
      redirect_uri = params[:redirect_uri]
      if redirect_uri.present? && redirect_uri != @oauth_app.redirect_uri
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
  end
end

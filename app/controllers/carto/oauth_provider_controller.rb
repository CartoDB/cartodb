# encoding: UTF-8

module Carto
  class OauthProviderController < ApplicationController
    ssl_required

    layout 'frontend'

    before_action :set_redirection_error_handling, only: [:consent, :authorize]
    before_action :load_oauth_app, :verify_redirect_uri
    before_action :validate_response_type, :validate_scopes, :ensure_state, only: [:consent, :authorize]
    before_action :validate_grant_type, only: [:token]

    rescue_from OauthProvider::Errors::BaseError, with: :rescue_oauth_errors

    def consent

    end

    def authorize
      raise OauthProvider::Errors::AccessDenied.new unless params[:accept]

      redirect_to_oauth_app(code: 'wadus', state: @state)
    end

    def token
      # Input
      #grant_type == authorization_code
      #code =
      #redirect_uri
      #client_id

      # Out
      #{
      #  "access_token":"87as6das87tdy",
      #  "token_type":"api_key",
      #}
    end

    private

    def redirect_to_oauth_app(parameters)
      redirect_uri = Addressable::URI.parse(@redirect_uri)
      query = redirect_uri.query_values || {}
      query.merge!(parameters)
      redirect_uri.query_values = query

      redirect_to redirect_uri.to_s
    end

    def set_redirection_error_handling
      @redirect_on_error = true
    end

    def rescue_oauth_errors(exception)
      if @redirect_on_error && @redirect_uri
        redirect_to_oauth_app(exception.parameters)
      elsif @redirect_on_error
        render_404
      else
        render json: exception.parameters, status: 400
      end
    end

    def validate_response_type
      @response_type = params[:response_type]
      unless @response_type == 'code'
        raise OauthProvider::Errors::UnsupportedResponseType.new('Only response_type=code is currently supported')
      end
    end

    def validate_grant_type
      unless params[:grant_type] == 'authorization_code'
        raise OauthProvider::Errors::UnsupportedGrantType.new(
          'Only grant_type=authorization_code is currently supported'
          )
      end
    end

    def load_oauth_app
      @oauth_app = OauthApp.find_by_client_id!(params[:client_id])
    rescue ActiveRecord::RecordNotFound
      raise OauthProvider::Errors::InvalidRequest.new('Client ID not found')
    end

    def verify_redirect_uri
      @redirect_uri = params[:redirect_uri]
      if @redirect_uri.present? && !@oauth_app.redirect_urls.include?(@redirect_uri)
        raise OauthProvider::Errors::InvalidRequest.new('The redirect_uri is not authorized for this application')
      end
      @redirect_uri ||= @oauth_app.redirect_urls.first
    end

    def validate_scopes
      @scopes = (params[:scope] || '').split(' ')
      raise OauthProvider::Errors::InvalidScope.new("Unsupported scopes: #{@scopes.join(', ')}") if @scopes.any?
    end

    def ensure_state
      @state = params[:state]
      raise OauthProvider::Errors::InvalidRequest.new('state is mandatory') unless @state.present?
    end
  end
end

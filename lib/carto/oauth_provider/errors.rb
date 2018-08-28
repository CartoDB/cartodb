module Carto
  module OauthProvider
    module Errors
      class BaseError < RuntimeError
        def initialize(code, description = nil, uri = nil)
          @code = code
          @description = description
          @uri = uri
        end

        def parameters
          params = { error: @code }
          params[:error_description] = @description if @description.present?
          params[:error_uri] = @uri if @uri.present?

          params
        end

        def error_message
          "#{@code}: #{@description}"
        end
      end

      class InvalidRequest < BaseError
        def initialize(description = nil, uri = nil)
          super('invalid_request', description, uri)
        end
      end

      class UnsupportedResponseType < BaseError
        def initialize(supported)
          super('unsupported_response_type', "Only the following response types are supported: #{supported.join(', ')}")
        end
      end

      class InvalidScope < BaseError
        def initialize(scopes, message: nil)
          super('invalid_scope', message || "Unsupported scopes: #{scopes.join(', ')}")
        end
      end

      class AccessDenied < BaseError
        def initialize(message = 'The user rejected the authentication request')
          super('access_denied', message)
        end
      end

      class ServerError < BaseError
        def initialize(description = nil, uri = nil)
          super('server_error', description, uri)
        end
      end

      class UnsupportedGrantType < BaseError
        def initialize(supported)
          super('unsupported_grant_type', "Only the following grant types are supported: #{supported.join(', ')}")
        end
      end

      class InvalidGrant < BaseError
        def initialize
          super('invalid_grant', 'Provided code is not valid or has expired')
        end
      end

      class InvalidClient < BaseError
        def initialize
          super('invalid_client', 'Invalid client ID or secret')
        end
      end

      class LoginRequired < BaseError
        def initialize
          super('login_required', 'The user must be logged in')
        end
      end
    end
  end
end

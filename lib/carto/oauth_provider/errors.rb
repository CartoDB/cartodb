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
        def initialize(scopes)
          super('invalid_scope', "Unsupported scopes: #{scopes.join(', ')}")
        end
      end

      class AccessDenied < BaseError
        def initialize
          super('access_denied', 'The user rejected the authentication request')
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
    end
  end
end

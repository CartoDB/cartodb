require 'dropbox_api'

# These classes add toking revoking features to dropbox_api gem. They should be eventually sent there.
module DropboxApi::Metadata
  class Revoke < Base
    def initialize(_response_data)
      # response_data is empty
    end
  end
end

module DropboxApi::Endpoints
  module Auth
    module Token
      class Revoke < DropboxApi::Endpoints::Rpc
        Method      = :post
        Path        = "/2/auth/token/revoke".freeze
        ResultType  = DropboxApi::Metadata::Revoke
        ErrorType   = DropboxApi::Errors::BasicError

        # Revoke token
        #
        # @return [Revoke] Empty response
        add_endpoint :revoke do
          perform_request nil
        end
      end
    end
  end
end

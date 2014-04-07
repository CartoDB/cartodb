# encoding: utf-8

module CartoDB
  module Datasources

      class DatasourceBaseError  < StandardError

        UNKNOWN_SERVICE = 'UKNOWN'

        def initialize(message = 'General error', service = UNKNOWN_SERVICE)
          message = "#{message}"
          message << " @ #{service}" if service != UNKNOWN_SERVICE
          super(message)
        end #initialize
      end #DatasourceBaseError

      class AuthError                   < DatasourceBaseError; end
      # This exception is ONLY throwed if oauth token is wrong or expired, and should be deleted if exists
      class TokenExpiredOrInvalidError  < AuthError; end
      class InvalidServiceError         < DatasourceBaseError; end
      class DataDownloadError           < DatasourceBaseError; end
      class MissingConfigurationError   < DatasourceBaseError; end
      class UninitializedError          < DatasourceBaseError; end

  end #Datasources
end #CartoDB
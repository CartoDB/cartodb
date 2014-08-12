# encoding: utf-8

module CartoDB
  module Datasources

      class DatasourceBaseError  < StandardError

        UNKNOWN_SERVICE = 'UKNOWN'

        attr_reader :service_name

        def initialize(message = 'General error', service = UNKNOWN_SERVICE)
          @service_name  = service

          message = "#{message}"
          message << " @ #{@service_name}" if @service_name != UNKNOWN_SERVICE
          super(message)
        end
      end

      class AuthError                   < DatasourceBaseError; end
      # This exception is ONLY throwed if oauth token is wrong or expired, and should be deleted if exists
      class TokenExpiredOrInvalidError  < AuthError; end
      class InvalidServiceError         < DatasourceBaseError; end
      class DataDownloadError           < DatasourceBaseError; end
      class MissingConfigurationError   < DatasourceBaseError; end
      class UninitializedError          < DatasourceBaseError; end
      class ParameterError              < DatasourceBaseError; end

  end
end
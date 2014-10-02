# encoding: utf-8

module CartoDB
  module Datasources

    # Remember to add new errors to:
    # config/initializers/carto_db.rb
    # services/importer/lib/importer/exceptions.rb

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
      class ServiceDisabledError        < DatasourceBaseError; end
      class OutOfQuotaError             < DatasourceBaseError; end
      class InvalidInputDataError       < DatasourceBaseError; end
      class ResponseError               < DatasourceBaseError; end
      class ExternalServiceError        < DatasourceBaseError; end
  end
end
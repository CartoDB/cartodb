module CartoDB
  module Datasources

    # Remember to add new errors to:
    # config/initializers/carto_db.rb
    # services/importer/lib/importer/exceptions.rb

      class DatasourceBaseError  < StandardError

        UNKNOWN_SERVICE = 'UNKNOWN'.freeze

        attr_reader :service_name

        def initialize(message = 'General error', service = UNKNOWN_SERVICE, username = nil)
          @service_name  = service
          message = "#{message}"
          message << " @ #{@service_name}" if @service_name != UNKNOWN_SERVICE
          message << " User: #{username}" unless username.nil?
          super(message)
        end
      end

      class AuthError                   < DatasourceBaseError; end
      # This exception is ONLY throwed if oauth token is wrong or expired, and should be deleted if exists
      class TokenExpiredOrInvalidError  < AuthError; end
      class InvalidServiceError         < DatasourceBaseError; end
      class DataDownloadError           < DatasourceBaseError; end
      class UnsupportedOperationError   < DatasourceBaseError; end
      class NotFoundDownloadError       < DatasourceBaseError; end
      class MissingConfigurationError   < DatasourceBaseError; end
      class UninitializedError          < DatasourceBaseError; end
      class NoResultsError              < DatasourceBaseError; end
      class ParameterError              < DatasourceBaseError; end

      class OutOfQuotaError             < DatasourceBaseError; end
      class InvalidInputDataError       < DatasourceBaseError; end
      class ResponseError               < DatasourceBaseError; end
      class ExternalServiceError        < DatasourceBaseError; end

      class GNIPServiceError            < ExternalServiceError; end

      class ServiceDisabledError < DatasourceBaseError
        def initialize(service = UNKNOWN_SERVICE, username = nil)
          super("Service disabled", service, username)
        end
      end

      class DataDownloadTimeoutError < DatasourceBaseError
        def initialize(service = UNKNOWN_SERVICE, username = nil)
          super("Data download timed out. Check the source is not running slow and/or try again.", service, username)
        end
      end

      class ExternalServiceTimeoutError < DatasourceBaseError
        def initialize(service = UNKNOWN_SERVICE, username = nil)
          super("External service timed out. Check the source is not running slow and/or try again.", service, username)
        end
      end

      class DatasourcePermissionError < DatasourceBaseError; end
      class DropboxPermissionError < DatasourcePermissionError; end
      class BoxPermissionError < DatasourcePermissionError; end

      class GDriveNoExternalAppsAllowedError < DatasourceBaseError; end
  end
end

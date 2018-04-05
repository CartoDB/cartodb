# encoding: utf-8

require_relative '../../../../services/datasources/lib/datasources/exceptions'
require_relative './connector_runner'

module CartoDB
  module Importer2

    class BaseImportError < StandardError
      def initialize(message, error_code=nil)
        super(message)
        self.error_code = error_code
      end

      attr_accessor :error_code
    end

    # Generic/unmapped errors
    class GenericImportError < StandardError
      def initialize(message = "Import Error")
        super
      end
    end
    # Mapped errors

    class FileTooBigError < BaseImportError
      def initialize(message = "The file supplied exceeds the maximum allowed for the user")
        super(message, 6666)
      end
    end

    class TooManyTableRowsError < BaseImportError
      def initialize(message = "The imported table contains more rows than allowed for the user")
        super(message, 6668)
      end
    end

    class UserConcurrentImportsLimitError < BaseImportError
      def initialize(message = "User already using all allowed import slots")
        super(message,6669)
      end
    end

    class TooManyNamedMapTemplatesError < BaseImportError
      def initialize(message = "User reached the limit on number of templates")
        super(message, 6670)
      end
    end

    class StuckImportJobError < BaseImportError
      def initialize(message = "The import job was stuck and we marked it as failed")
        super(message, 6671)
      end
    end

    class DownloadTimeoutError < BaseImportError
      def initialize(message = "Data download timed out. Check the source is not running slow and/or try again.")
        super(message, 1020)
      end
    end

    class CartoDBfyError < BaseImportError
      def initialize(message = "Error CartoDBFying table")
        super(message, 2010)
      end
    end

    class CartoDBfyInvalidID < BaseImportError
      def initialize(message = "Invalid cartodb_id")
        super(message, 2011)
      end
    end

    class InstallError                          < StandardError; end
    class EmptyFileError                        < StandardError; end
    class ExtractionError                       < StandardError; end
    class PasswordNeededForExtractionError      < ExtractionError; end
    class TooManyLayersError                    < StandardError; end
    class GeometryCollectionNotSupportedError   < StandardError; end
    class InvalidGeoJSONError                   < StandardError; end
    class InvalidShpError                       < StandardError; end
    class InvalidGeometriesError                < StandardError; end
    class KmlNetworkLinkError                   < StandardError; end
    class KmlWithoutStyleIdError                < GenericImportError; end
    class IncompatibleSchemas                   < BaseImportError
      def initialize
        super('Incompatible Schemas', 2012)
      end
    end
    class InvalidNameError                      < BaseImportError
      def initialize(message)
        super(message, 1014)
      end
    end
    class LoadError                             < StandardError; end
    class MissingProjectionError                < StandardError; end
    class ShpNormalizationError                 < StandardError; end
    class StorageQuotaExceededError             < StandardError; end
    class TableQuotaExceededError               < StandardError; end
    class TiffToSqlConversionError              < StandardError; end
    class UnknownError                          < StandardError; end
    class UnknownSridError                      < StandardError; end
    class UnsupportedFormatError                < GenericImportError; end
    class UploadError                           < StandardError; end

    class DownloadError                         < StandardError; end
    class NotFoundDownloadError                 < DownloadError; end
    class UnauthorizedDownloadError             < DownloadError; end
    class CouldntResolveDownloadError           < DownloadError; end
    class PartialDownloadError                  < DownloadError; end

    class TooManyNodesError                     < StandardError; end
    class NotAFileError                         < StandardError; end
    class EncodingDetectionError                < StandardError; end
    class MalformedXLSException                 < StandardError; end
    class XLSXFormatError                       < StandardError; end
    class MalformedCSVException                 < GenericImportError; end
    class TooManyColumnsError                   < GenericImportError; end
    class TooManyColumnsProcessingError         < GenericImportError; end
    class DuplicatedColumnError                 < GenericImportError; end
    class RowsEncodingColumnError               < GenericImportError; end
    class EncodingError                         < StandardError; end

    class StatementTimeoutError                 < BaseImportError; end

    # @see also app/models/synchronization/member.rb => run() for more error codes
    # @see lib/cartodb/import_error_codes.rb For the texts
    ERRORS_MAP = {
      InstallError                          => 0001,
      UploadError                           => 1000,

      DownloadError                         => 1001,
      NotFoundDownloadError                 => 1100,
      UnauthorizedDownloadError             => 1101,
      CouldntResolveDownloadError           => 1102,
      PartialDownloadError                  => 1103,

      UnsupportedFormatError                => 1002,
      ExtractionError                       => 1003,
      XLSXFormatError                       => 1004,
      EmptyFileError                        => 1005,
      InvalidShpError                       => 1006,
      TooManyNodesError                     => 1007,
      NotAFileError                         => 1010,
      InvalidNameError                      => 1014,
      PasswordNeededForExtractionError      => 1018,
      TooManyLayersError                    => 1019,
      DownloadTimeoutError                  => 1020,
      LoadError                             => 2001,
      EncodingDetectionError                => 2002,
      MalformedCSVException                 => 2003,
      TooManyColumnsError                   => 2004,
      TooManyColumnsProcessingError         => 2004,
      DuplicatedColumnError                 => 2005,
      EncodingError                         => 2006,
      RowsEncodingColumnError               => 2007,
      MalformedXLSException                 => 2008,
      KmlWithoutStyleIdError                => 2009,
      IncompatibleSchemas                   => 2012,
      InvalidGeometriesError                => 2014,
      InvalidGeoJSONError                   => 3007,
      UnknownSridError                      => 3008,
      ShpNormalizationError                 => 3009,
      MissingProjectionError                => 3101,
      GeometryCollectionNotSupportedError   => 3201,
      KmlNetworkLinkError                   => 3202,
      FileTooBigError                       => 6666,
      StatementTimeoutError                 => 6667,
      TooManyTableRowsError                 => 6668,
      UserConcurrentImportsLimitError       => 6669,
      StuckImportJobError                   => 6671,
      StorageQuotaExceededError             => 8001,
      TableQuotaExceededError               => 8002,
      UnknownError                          => 99999,
      CartoDB::Datasources::DatasourceBaseError                   => 1012,
      CartoDB::Datasources::AuthError                             => 1012,
      CartoDB::Datasources::TokenExpiredOrInvalidError            => 1012,
      CartoDB::Datasources::InvalidServiceError                   => 1012,
      CartoDB::Datasources::DataDownloadError                     => 1011,
      CartoDB::Datasources::DataDownloadTimeoutError              => 1020,
      CartoDB::Datasources::ExternalServiceTimeoutError           => 1020,
      CartoDB::Datasources::MissingConfigurationError             => 1012,
      CartoDB::Datasources::UninitializedError                    => 1012,
      CartoDB::Datasources::NoResultsError                        => 1015,
      CartoDB::Datasources::UnsupportedOperationError             => 1023,
      CartoDB::Datasources::ParameterError                        => 99999,
      CartoDB::Datasources::ServiceDisabledError                  => 99999,
      CartoDB::Datasources::OutOfQuotaError                       => 8006,
      CartoDB::Datasources::InvalidInputDataError                 => 1012,
      CartoDB::Datasources::ResponseError                         => 1011,
      CartoDB::Datasources::ExternalServiceError                  => 1012,
      CartoDB::Datasources::GNIPServiceError                      => 1009,
      CartoDB::Datasources::DropboxPermissionError                => 1016,
      CartoDB::Datasources::BoxPermissionError                    => 1021,
      CartoDB::Datasources::GDriveNoExternalAppsAllowedError      => 1008,
      Carto::Connector::ConnectorError               => 1500,
      Carto::Connector::ConnectorsDisabledError      => 1501,
      Carto::Connector::InvalidParametersError       => 1502
    }
  end
end

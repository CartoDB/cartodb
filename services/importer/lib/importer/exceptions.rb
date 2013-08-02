# encoding: utf-8

module CartoDB
  module Importer2
    class UploadError                           < StandardError; end
    class UnsupportedFormatError                < StandardError; end
    class ExtractionError                       < StandardError; end
    class EncodingError                         < StandardError; end
    class EmptyFileError                        < StandardError; end
    class InvalidShpError                       < StandardError; end
    class UnableToDownloadError                 < StandardError; end
    class OsmLimitReachedError                  < StandardError; end
    class FileConversionError                   < StandardError; end
    class GeometryError                         < StandardError; end
    class ShpToSqlConversionError               < StandardError; end
    class CsvToSqlError                         < StandardError; end
    class InvalidGeoJSONError                   < StandardError; end
    class UnknownSridError                      < StandardError; end
    class ProjectionError                       < StandardError; end
    class MissingProjectionError                < StandardError; end
    class UnsupportedProjectionError            < StandardError; end
    class UnableToForce2DGeometryError          < StandardError; end
    class UnsupportedGeometryTypeError          < StandardError; end
    class GeometryCollectionNotSupportedError   < StandardError; end
    class RasterError                           < StandardError; end
    class EmptyTableError                       < StandardError; end
    class ReservedColumnNameError               < StandardError; end
    class OsmImportError                        < StandardError; end
    class AccountError                          < StandardError; end
    class StorageQuotaExceededError             < StandardError; end
    class TableQuotaExceededError               < StandardError; end
    class UnknownError                          < StandardError; end
    class ShpNormalizationError                 < StandardError; end
    class EmptyGeometryColumn                   < StandardError; end


    ERRORS_MAP = {
      UploadError                           => 1000,
      UnsupportedFormatError                => 1002,
      ExtractionError                       => 1003,
      EncodingError                         => 1004,
      EmptyFileError                        => 1005,
      InvalidShpError                       => 1006,
      UnableToDownloadError                 => 1008,
      OsmLimitReachedError                  => 1009,
      FileConversionError                   => 2000,
      GeometryError                         => 3000,
      ShpToSqlConversionError               => 3005,
      CsvToSqlError                         => 3006,
      InvalidGeoJSONError                   => 3007,
      UnknownSridError                      => 3008,
      ProjectionError                       => 3100,
      MissingProjectionError                => 3101,
      UnsupportedProjectionError            => 3102,
      UnableToForce2DGeometryError          => 3110,
      UnsupportedGeometryTypeError          => 3200,
      GeometryCollectionNotSupportedError   => 3201,
      RasterError                           => 4000,
      EmptyTableError                       => 5001,
      ReservedColumnNameError               => 5002,
      OsmImportError                        => 6000,
      AccountError                          => 8000,
      StorageQuotaExceededError             => 8001,
      TableQuotaExceededError               => 8002,
      UnknownError                          => 99999
    }
  end # Importer2
end # CartoDB


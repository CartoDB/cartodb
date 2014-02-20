# encoding: utf-8

module CartoDB
  module Importer2

    # Generic/unmapped errors
    class GenericImportError                    < StandardError; end
    # Mapped errors
    class InstallError                          < StandardError; end
    class EmptyFileError                        < StandardError; end
    class ExtractionError                       < StandardError; end
    class GeometryCollectionNotSupportedError   < StandardError; end
    class InvalidGeoJSONError                   < StandardError; end
    class InvalidShpError                       < StandardError; end
    class KmlNetworkLinkError                   < StandardError; end
    class LoadError                             < StandardError; end
    class MissingProjectionError                < StandardError; end
    class ShpNormalizationError                 < StandardError; end
    class StorageQuotaExceededError             < StandardError; end
    class TableQuotaExceededError               < StandardError; end
    class TiffToSqlConversionError              < StandardError; end
    class UnknownError                          < StandardError; end
    class UnknownSridError                      < StandardError; end
    class UnsupportedFormatError                < StandardError; end
    class UploadError                           < StandardError; end
    class DownloadError                         < StandardError; end
    class GDriveNotPublicError                  < StandardError; end
    class EncodingDetectionError                < StandardError; end
    class XLSXFormatError                       < StandardError; end

    ERRORS_MAP = {
      InstallError                          => 0001,
      EmptyFileError                        => 1005,
      ExtractionError                       => 1003,
      GeometryCollectionNotSupportedError   => 3201,
      InvalidGeoJSONError                   => 3007,
      InvalidShpError                       => 1006,
      KmlNetworkLinkError                   => 3202,
      LoadError                             => 2001,
      MissingProjectionError                => 3101,
      ShpNormalizationError                 => 3009,
      StorageQuotaExceededError             => 8001,
      TableQuotaExceededError               => 8002,
      UnknownError                          => 99999,
      UnknownSridError                      => 3008,
      UnsupportedFormatError                => 1002,
      XLSXFormatError                       => 1004,
      UploadError                           => 1000,
      DownloadError                         => 1001,
      GDriveNotPublicError                  => 1010,
      EncodingDetectionError                => 2002
    }
  end # Importer2
end # CartoDB


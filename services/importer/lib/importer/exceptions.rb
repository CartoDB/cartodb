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
    class MalformedCSVException                 < GenericImportError; end

    ERRORS_MAP = {
      InstallError                          => 0001,
      UploadError                           => 1000,
      DownloadError                         => 1001,
      UnsupportedFormatError                => 1002,
      ExtractionError                       => 1003,
      XLSXFormatError                       => 1004,
      EmptyFileError                        => 1005,
      InvalidShpError                       => 1006,
      GDriveNotPublicError                  => 1010,
      LoadError                             => 2001,
      EncodingDetectionError                => 2002,
      MalformedCSVException                 => 2003,
      InvalidGeoJSONError                   => 3007,
      UnknownSridError                      => 3008,
      ShpNormalizationError                 => 3009,
      MissingProjectionError                => 3101,
      GeometryCollectionNotSupportedError   => 3201,
      KmlNetworkLinkError                   => 3202,
      StorageQuotaExceededError             => 8001,
      TableQuotaExceededError               => 8002,
      UnknownError                          => 99999
    }
  end # Importer2
end # CartoDB


# encoding: utf-8
require_relative './importer/column'
require_relative './importer/downloader'
require_relative './importer/georeferencer'
require_relative './importer/job'
require_relative './importer/loader'
require_relative './importer/ogr2ogr'
require_relative './importer/runner'
require_relative './importer/source_file'

module CartoDB
  module Importer2
    SUPPORTED_FORMATS  = %W{
      .csv .shp .ods .xls .xlsx .tif .tiff .kml .kmz
      .js .json .tar .gz .tgz .osm .bz2 .geojson .gpx .json .sql
    }
  end # Importer2
end # CartoDB


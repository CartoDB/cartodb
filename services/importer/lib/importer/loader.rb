# encoding: utf-8
require_relative './ogr2ogr'
require_relative './format_linter'
require_relative './csv_normalizer'
require_relative './shp_normalizer'
require_relative './json2csv'
require_relative './xlsx2csv'
require_relative './xls2csv'
require_relative './georeferencer'

module CartoDB
  module Importer2
    class Loader
      SCHEMA            = 'cdb_importer'
      TABLE_PREFIX      = 'importer'
      NORMALIZERS       = [FormatLinter, CsvNormalizer, Xls2Csv, Xlsx2Csv, Json2Csv]
      DEFAULT_ENCODING  = 'UTF-8'

      def self.supported?(extension)
        !(%w{ .tif .tiff .sql }.include?(extension))
      end #self.supported?

      def initialize(job, source_file, layer=nil, ogr2ogr=nil, georeferencer=nil)
        self.job            = job
        self.source_file    = source_file
        self.layer          = 'track_points' if source_file.extension =~ /\.gpx/
        self.ogr2ogr        = ogr2ogr
        self.georeferencer  = georeferencer
      end #initialize

      def run
        normalize
        job.log "Detected encoding #{encoding}"
        job.log "Using database connection with #{job.concealed_pg_options}"
        ogr2ogr.run

        job.log "ogr2ogr output:    #{ogr2ogr.command_output}"
        job.log "ogr2ogr exit code: #{ogr2ogr.exit_code}"

        raise InvalidGeoJSONError if ogr2ogr.command_output =~ /nrecognized GeoJSON/
        raise LoadError(job.fetch) if ogr2ogr.exit_code != 0
        job.log 'Georeferencing...'
        georeferencer.run
        job.log 'Georeferenced'
        self
      end #run

      def normalize
        converted_filepath = normalizers_for(source_file.extension)
          .inject(source_file.fullpath) { |filepath, normalizer_klass|
            normalizer_klass.new(filepath, job).run.converted_filepath
          }
        layer = source_file.layer
        @source_file = SourceFile.new(converted_filepath)
        @source_file.layer = layer
        self
      end #normalize

      def ogr2ogr
        @ogr2ogr ||= Ogr2ogr.new(
          job.table_name, @source_file.fullpath, job.pg_options,
          @source_file.layer, ogr2ogr_options
        )
      end #ogr2ogr

      def ogr2ogr_options
        options = { encoding: encoding }
        if source_file.extension == '.shp'
          options.merge!(shape_encoding: shape_encoding) 
        end
        options
      end

      def encoding
        normalizer = [ShpNormalizer, CsvNormalizer].find { |normalizer|
          normalizer.supported?(source_file.extension)
        }
        return DEFAULT_ENCODING unless normalizer
        normalizer.new(source_file.fullpath, job).encoding
      end #encoding

      def shape_encoding
        normalizer = [ShpNormalizer].find { |normalizer|
          normalizer.supported?(source_file.extension)
        }
        return nil unless normalizer
        normalizer.new(source_file.fullpath, job).shape_encoding
      end

      def georeferencer
        @georeferencer ||= Georeferencer.new(
          job.db, job.table_name, SCHEMA, job, geometry_columns
        )
      end #georeferencer

      def geometry_columns
        ['wkb_geometry'] if @source_file.extension == '.shp'
      end

      def valid_table_names
        [job.table_name]
      end #valid_table_names

      def normalizers_for(extension)
        NORMALIZERS.find_all { |klass| klass.supported?(extension) }
      end #normalizers_for

      def osm?(source_file)
        source_file.extension =~ /\.osm/
      end

      private

      attr_writer     :ogr2ogr, :georeferencer
      attr_accessor   :job, :source_file, :layer
    end # Loader
  end # Importer2
end # CartoDB


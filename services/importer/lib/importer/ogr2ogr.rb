# encoding: utf-8
require 'open3'
require_relative './shp_helper'

module CartoDB
  module Importer2
    class Ogr2ogr
      ENCODING  = 'UTF-8'
      SCHEMA    = 'cdb_importer'

      OUTPUT_FORMAT_OPTION  = '-f PostgreSQL'
      PG_COPY_OPTION        = 'PG_USE_COPY=YES'
      NEW_LAYER_TYPE_OPTION = '-nlt PROMOTE_TO_MULTI'
      OSM_INDEXING_OPTION   = 'OSM_USE_CUSTOM_INDEXING=NO'
      APPEND_MODE_OPTION    = '-append'

      DEFAULT_BINARY = 'which ogr2ogr2'

      LATITUDE_POSSIBLE_NAMES   = %w{ latitude lat latitudedecimal
        latitud lati decimallatitude decimallat point_latitude }
      LONGITUDE_POSSIBLE_NAMES  = %w{ longitude lon lng
        longitudedecimal longitud long decimallongitude decimallong point_longitude }


      def initialize(table_name, filepath, pg_options, layer=nil, options={})
        self.filepath   = filepath
        self.pg_options = pg_options
        self.table_name = table_name
        self.layer      = layer
        self.options    = options
        self.command_output = ''
        self.exit_code = 0
        set_default_properties
      end

      def set_default_properties
        self.append_mode = false
        self.overwrite = false
        self.ogr2ogr2_binary = options.fetch(:ogr2ogr_binary, DEFAULT_BINARY)
        self.csv_guessing = options.fetch(:ogr2ogr_csv_guessing, false)
        self.quoted_fields_guessing = options.fetch(:quoted_fields_guessing, true)
        self.encoding = options.fetch(:encoding, ENCODING)
        self.shape_encoding = ''
        self.shape_coordinate_system = options.fetch(:shape_coordinate_system, '')
      end

      def command_for_import
        "#{OSM_INDEXING_OPTION} #{PG_COPY_OPTION} #{client_encoding_option} #{shape_encoding_option} " +
        "#{executable_path} #{OUTPUT_FORMAT_OPTION} #{overwrite_option} #{guessing_option} " +
        "#{postgres_options} #{projection_option} #{layer_creation_options} #{filepath} #{layer} " +
        "#{layer_name_option} #{new_layer_type_option} #{shape_coordinate_option} "
      end

      def command_for_append
        "#{OSM_INDEXING_OPTION} #{PG_COPY_OPTION} #{client_encoding_option} " +
        "#{executable_path} #{APPEND_MODE_OPTION} #{OUTPUT_FORMAT_OPTION} #{postgres_options} " +
        "#{projection_option} #{filepath} #{layer} #{layer_name_option} #{NEW_LAYER_TYPE_OPTION}"
      end

      def executable_path
        `#{ogr2ogr2_binary}`.strip
      end

      def command
        append_mode ? command_for_append : command_for_import
      end

      def run(use_append_mode=false)
        @append_mode = use_append_mode
        stdout, stderr, status  = Open3.capture3(command)
        self.command_output     = (stdout + stderr).encode('UTF-8', 'binary', invalid: :replace, undef: :replace, replace: '?????')
        self.exit_code          = status.to_i
        self
      end

      def generic_error?
        command_output =~ /ERROR 1:/ || command_output =~ /ERROR:/
      end

      def encoding_error?
        command_output =~ /has no equivalent in encoding/ || command_output =~ /invalid byte sequence for encoding/
      end

      def invalid_dates?
        command_output =~ /date\/time field value out of range/
      end

      def duplicate_column?
        command_output =~ /column (.*) of relation (.*) already exists/ || command_output =~ /specified more than once/
      end

      def invalid_geojson?
        command_output =~ /nrecognized GeoJSON/
      end

      def too_many_columns?
        command_output =~ /tables can have at most 1600 columns/
      end

      def unsupported_format?
        exit_code == 256 && command_output =~ /Unable to open(.*)with the following drivers/
      end

      def file_too_big?
        (exit_code == 256 && command_output =~ /calloc failed/) ||
        (exit_code == 35072 && command_output =~ /Killed/)
      end

      def statement_timeout?
        command_output =~ /canceling statement due to statement timeout/i
      end

      def segfault_error?
        exit_code == 35584 && command_output =~ /Segmentation fault/
      end

      def kml_style_missing?
        is_kml? && command_output =~/Parseing kml Style: No id/
      end

      attr_accessor :append_mode, :filepath, :csv_guessing, :overwrite, :encoding, :shape_encoding,
                    :shape_coordinate_system
      attr_reader   :exit_code, :command_output

      private

      attr_writer   :exit_code, :command_output
      attr_accessor :pg_options, :options, :table_name, :layer, :ogr2ogr2_binary, :quoted_fields_guessing

      def is_csv?
        !(filepath =~ /\.csv$/i).nil?
      end

      def is_kml?
        !(filepath =~ /\.kml$/i).nil?
      end

      def is_geojson?
        !(filepath =~ /\.geojson$/i).nil?
      end

      def is_shp?
        !(filepath =~ /\.shp$/i).nil?
      end

      def guessing_option
        if csv_guessing && is_csv?
          # Inverse of the selection: if I want guessing I must NOT leave quoted fields as string
          "-oo AUTODETECT_TYPE=YES -oo QUOTED_FIELDS_AS_STRING=#{quoted_fields_guessing ? 'NO' : 'YES' } " +
          "#{x_y_possible_names_option} -s_srs EPSG:4326 -t_srs EPSG:4326"
        else
          ''
        end
      end

      def x_y_possible_names_option
        "-oo X_POSSIBLE_NAMES=#{LONGITUDE_POSSIBLE_NAMES.join(',')} -oo Y_POSSIBLE_NAMES=#{LATITUDE_POSSIBLE_NAMES.join(',')}"
      end

      def new_layer_type_option
        # We don't want lat/long columns to generate multipoints in the wkb_geometry column that
        # can be afterwards choosen by the cartodbfication
        if csv_guessing && is_csv?
          ''
        else
          NEW_LAYER_TYPE_OPTION
        end
      end

      def overwrite_option
        overwrite ? "-overwrite" : ''
      end

      def client_encoding_option
        "PGCLIENTENCODING=#{encoding}"
      end

      def shape_encoding_option
        !shape_encoding.nil? && !shape_encoding.empty? ? "SHAPE_ENCODING=#{shape_encoding}" : ''
      end

      def shape_coordinate_option
        shape_coordinate_system.empty? ? '' : "-s_srs EPSG:#{shape_coordinate_system}"
      end

      def layer_name_option
        "-nln #{SCHEMA}.#{table_name}"
      end

      # @see http://www.gdal.org/drv_pg.html
      # @see http://www.gdal.org/drv_pg_advanced.html
      def postgres_options
        %Q{PG:"host=#{pg_options.fetch(:host)} }      +
        %Q{port=#{pg_options.fetch(:port)} }          +
        %Q{user=#{pg_options.fetch(:user)} }          +
        %Q{dbname=#{pg_options.fetch(:database)} }    +
        %Q{password=#{pg_options.fetch(:password)}"}
        # 'schemas=#{SCHEMA},cartodb' param is no longer needed, let the DB build the proper one
      end

      def layer_creation_options
        # Dimension option, precision option
        "-lco DIM=2 -lco PRECISION=NO"
      end

      def projection_option
        is_csv? || filepath =~ /\.ods/ ? nil : '-t_srs EPSG:4326 '
      end
    end
  end
end


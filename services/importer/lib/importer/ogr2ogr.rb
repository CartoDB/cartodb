# encoding: utf-8
require 'open3'

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

      DEFAULT_BINARY = 'which ogr2ogr'

      def initialize(table_name, filepath, pg_options, layer=nil, options={})
        self.filepath   = filepath
        self.pg_options = pg_options
        self.table_name = table_name
        self.layer      = layer
        self.options    = options
        self.append_mode = false
        @overwrite = false
        self.ogr2ogr2_binary = options.fetch(:ogr2ogr_binary, DEFAULT_BINARY)
        self.csv_guessing = options.fetch(:ogr2ogr_csv_guessing, false)
        self.quoted_fields_guessing = options.fetch(:quoted_fields_guessing, true)
      end

      def command_for_import
        "#{OSM_INDEXING_OPTION} #{PG_COPY_OPTION} #{client_encoding_option} #{shape_encoding_option} " +
        "#{executable_path} #{overwrite_option} #{OUTPUT_FORMAT_OPTION} #{guessing_option} #{postgres_options} #{projection_option} " +
        "#{layer_creation_options} #{filepath} #{layer} #{layer_name_option} #{NEW_LAYER_TYPE_OPTION}"
      end

      def command_for_append
        "#{OSM_INDEXING_OPTION} #{PG_COPY_OPTION} #{client_encoding_option} #{shape_encoding_option} " +
        "#{executable_path} #{APPEND_MODE_OPTION} #{overwrite_option} #{OUTPUT_FORMAT_OPTION} #{postgres_options} " +
        "#{projection_option} #{filepath} #{layer} #{layer_name_option} #{NEW_LAYER_TYPE_OPTION}"
      end

      def overwrite_option
        @overwrite ? '-overwrite' : ''
      end

      def executable_path
        (is_csv? || is_geojson?) ? `#{ogr2ogr2_binary}`.strip : `#{DEFAULT_BINARY}`.strip
      end

      def command
        append_mode ? command_for_append : command_for_import
      end

      def run(use_append_mode = false, overwrite = false)
        @append_mode = use_append_mode
        @overwrite = overwrite
        stdout, stderr, status  = Open3.capture3(command)
        self.command_output     = (stdout + stderr).encode('UTF-8', 'binary', invalid: :replace, undef: :replace, replace: '?????')
        self.exit_code          = status.to_i
        self
      end

      attr_accessor :append_mode, :filepath
      attr_reader   :exit_code, :command_output

      private

      attr_writer   :exit_code, :command_output
      attr_accessor :pg_options, :options, :table_name, :layer, :ogr2ogr2_binary, :csv_guessing, :quoted_fields_guessing

      def is_csv?
        !(filepath =~ /\.csv$/i).nil?
      end

      def is_geojson?
        !(filepath =~ /\.geojson$/i).nil?
      end

      def guessing_option
        if csv_guessing && is_csv?
          # Inverse of the selection: if I want guessing I must NOT leave quoted fields as string
          "-oo AUTODETECT_TYPE=YES -oo QUOTED_FIELDS_AS_STRING=#{quoted_fields_guessing ? 'NO' : 'YES' }"
        else
          ''
        end
      end

      def client_encoding_option
        "PGCLIENTENCODING=#{options.fetch(:encoding, ENCODING)}"
      end

      def shape_encoding_option
        encoding = options.fetch(:shape_encoding, nil)
        return unless encoding
        "SHAPE_ENCODING=#{encoding}"
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


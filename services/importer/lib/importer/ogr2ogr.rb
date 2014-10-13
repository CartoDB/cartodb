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

      def initialize(table_name, filepath, pg_options, layer=nil, options={})
        self.filepath   = filepath
        self.pg_options = pg_options
        self.table_name = table_name
        self.layer      = layer
        self.options    = options
        self.append_mode = false
        self.binary = options.fetch(:ogr2ogr_binary, 'which ogr2ogr')
        self.csv_guessing = options.fetch(:ogr2ogr_csv_guessing, false)
      end

      def command_for_import
        "#{OSM_INDEXING_OPTION} #{PG_COPY_OPTION} #{client_encoding_option} #{shape_encoding_option} " +
        "#{executable_path} #{OUTPUT_FORMAT_OPTION} #{guessing_option} #{postgres_options} #{projection_option} " +
        "#{layer_creation_options} #{filepath} #{layer} #{layer_name_option} #{NEW_LAYER_TYPE_OPTION}"
      end

      def command_for_append
        "#{OSM_INDEXING_OPTION} #{PG_COPY_OPTION} #{client_encoding_option} #{shape_encoding_option} " +
        "#{executable_path} #{APPEND_MODE_OPTION} #{OUTPUT_FORMAT_OPTION} #{postgres_options} " +
        "#{projection_option} #{filepath} #{layer} #{layer_name_option} #{NEW_LAYER_TYPE_OPTION}"
      end

      def executable_path
        `#{binary}`.strip
      end

      def command
        append_mode ? command_for_append : command_for_import
      end

      def run(use_append_mode=false)
        @append_mode = use_append_mode
        stdout, stderr, status  = Open3.capture3(command)
        self.command_output     = stdout + stderr
        self.exit_code          = status.to_i
        self
      end

      attr_accessor :append_mode, :filepath
      attr_reader   :exit_code, :command_output

      private

      attr_writer   :exit_code, :command_output
      attr_accessor :pg_options, :options, :table_name, :layer, :binary, :csv_guessing

      def guessing_option
        csv_guessing ? '-oo AUTODETECT_TYPE=YES -oo QUOTED_FIELDS_AS_STRING=NO' : ''
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
        filepath =~ /\.csv/ || filepath =~ /\.ods/ ? nil : '-t_srs EPSG:4326 '
      end
    end
  end
end


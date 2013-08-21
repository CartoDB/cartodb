# encoding: utf-8
require 'open3'
require_relative './exceptions'

module CartoDB
  module Importer2
    class Raster2Pgsql
      SCHEMA        = 'cdb_importer'
      DEFAULT_SRID  = 4326
      BLOCKSIZE     = "256x256"
      NORMALIZER_RELATIVE_PATH = 
        "../../../../../lib/importer/misc/shp_normalizer.py"

      def initialize(table_name, filepath, pg_options)
        self.filepath   = filepath
        self.pg_options = pg_options
        self.table_name = table_name
      end #initialize

      def run
        stdout, stderr, status  = Open3.capture3(command)
        self.command_output     = stdout + stderr
        self.exit_code          = status.to_i

        raise UnknownSridError          if command_output =~ /invalid SRID/
        raise TiffToSqlConversionError  if exit_code != 0
        raise TiffToSqlConversionError  if command_output =~ /failure/
        self
      end #run

      def command
        %Q(#{raster2pgsql_command} | #{psql_command })
      end #command

      def raster2pgsql_command
        %Q(#{raster2pgsql_path} -I -s 4326 -Y -t #{BLOCKSIZE} ) +
        %Q(#{filepath} #{table_name})
      end #raster_to_pgsql_command

      attr_reader   :exit_code, :command_output, :normalizer_output

      private

      attr_writer   :exit_code, :command_output, :normalizer_output
      attr_accessor :filepath, :pg_options, :table_name

      def raster2pgsql_path
        `which raster2pgsql`.strip
      end #raster2pgsql_path

      def psql_path
        `which psql`.strip
      end #psql_path

      def statement_timeout
        "echo 'set statement_timeout=600000;';"
      end #statement_timeout

      def pg_copy_option
        "PG_USE_COPY=YES"
      end #pg_copy_option

      def psql_command
        host      = pg_options.fetch(:host)
        port      = pg_options.fetch(:port)
        user      = pg_options.fetch(:user)
        database  = pg_options.fetch(:database)

        %Q(#{psql_path} -h #{host} -p #{port} -U #{user} -w -d #{database})
      end #psql_command

      def normalize
        stdout, stderr, status  = Open3.capture3(normalizer_command)
        output                  = stdout.strip.split(/, */, 4)
        self.normalizer_output  = {
          projection:   output[0],
          encoding:     output[1],
          source:       output[2],
          destination:  output[3]
        }

        raise ShpNormalizationError unless status.to_i == 0 
        raise ShpNormalizationError unless normalized?
        self
      end #normalize

      def normalized?
        normalizer_output && detected_projection
      end #normalize?

      def detected_projection
        projection = normalizer_output.fetch(:projection)
        return nil if projection == 'None'
        projection.to_i
      end #detected_projection

      def detected_encoding
        encoding = normalizer_output.fetch(:encoding)
        return 'LATIN1' if encoding == 'None' 
        return codepage_for(encoding) if windows?(encoding)
        encoding
      end #detected_encoding

      def normalizer_command
        %Q(#{python_bin_path} -Wignore #{normalizer_path} ) +
        %Q("#{filepath}" #{table_name})
      end #normalizer_command

      def python_bin_path
        `which python`.strip
      end #python_bin_path

      def normalizer_path
        File.expand_path(NORMALIZER_RELATIVE_PATH, __FILE__) 
      end #normalizer_path

      def codepage_for(encoding)
        encoding.gsub(/windows-/, 'CP')
      end #codepage_for

      def probably_wrongly_detected_codepage?(encoding)
        !!(encoding =~ /windows/)
      end #probably_wrongly_detected_codepage?

      alias_method :windows?, :probably_wrongly_detected_codepage?
    end # Raster2Pgsql
  end # Importer2
end # CartoDB


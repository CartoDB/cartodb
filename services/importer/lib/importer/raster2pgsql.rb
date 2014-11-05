# encoding: utf-8
require 'open3'
require_relative './exceptions'

module CartoDB
  module Importer2
    class Raster2Pgsql
      SCHEMA                        = 'cdb_importer'
      PROJECTION                    = 3857
      BLOCKSIZE                     = '128x128'
      WEBMERCATOR_FILENAME          = '%s_webmercator.tif'
      ALIGNED_WEBMERCATOR_FILENAME  = '%s_aligned_webmercator.tif'
      SQL_FILENAME                  = '%s%s.sql'

      def initialize(table_name, filepath, pg_options)
        self.filepath             = filepath
        self.basepath             = filepath.slice(0, filepath.rindex('/')+1)
        self.webmercator_filepath = WEBMERCATOR_FILENAME % [ filepath.gsub(/\.tif$/, '') ]
        self.aligned_filepath     = ALIGNED_WEBMERCATOR_FILENAME % [ filepath.gsub(/\.tif$/, '') ]
        self.sql_filepath         = SQL_FILENAME % [ basepath, table_name ]
        self.pg_options           = pg_options
        self.table_name           = table_name
        self.exit_code            = nil
        self.command_output       = nil
      end

      attr_reader   :exit_code, :command_output

      def run
        normalize
        stdout, stderr, status  = Open3.capture3(raster2pgsql_command)
        self.command_output     = stdout + stderr
        self.exit_code          = status.to_i
        output_message = "(#{exit_code}) |#{command_output}| Command: #{raster2pgsql_command}"

        raise UnknownSridError.new(output_message)          if command_output =~ /invalid srid/i
        raise TiffToSqlConversionError.new(output_message)  if exit_code != 0
        raise TiffToSqlConversionError.new(output_message)  if command_output =~ /failure/i

        stdout, stderr, status  = Open3.capture3(psql_command)
        self.command_output     = stdout + stderr
        self.exit_code          = status.to_i
        output_message = "(#{exit_code}) |#{command_output}| Command: #{psql_command}"

        raise TiffToSqlConversionError.new(output_message)  if exit_code != 0
        raise TiffToSqlConversionError.new(output_message)  if command_output =~ /error/i || command_output =~ /aborted/i

        self
      end

      private

      attr_writer   :exit_code, :command_output
      attr_accessor :filepath, :pg_options, :table_name, :webmercator_filepath, :aligned_filepath, :sql_filepath, \
                    :basepath

      def normalize
        stdout, stderr, status  = Open3.capture3(gdalwarp_command)
        self.command_output     = stdout + stderr
        self.exit_code          = status.to_i
        output_message = "(#{exit_code}) |#{command_output}| Command: #{gdalwarp_command}"

        raise TiffToSqlConversionError.new(output_message) if exit_code != 0
      end

      # TODO: build overviews
      def overviews
        # -l 2,4,8,16 etc
        ""
      end

      def raster2pgsql_command
        # TODO: Use aligned_filepath
        # We currently won't apply any constraint
        %Q(#{raster2pgsql_path} -I -Y -s #{PROJECTION} -t #{BLOCKSIZE} #{overviews} #{webmercator_filepath} ) +
        %Q(#{SCHEMA}.#{table_name} > #{sql_filepath})
      end

      def psql_command
        host      = pg_options.fetch(:host)
        port      = pg_options.fetch(:port)
        user      = pg_options.fetch(:user)
        database  = pg_options.fetch(:database)

        %Q(#{psql_path} -h #{host} -p #{port} -U #{user} -d #{database} -f #{sql_filepath})
      end

      def gdalwarp_command
        %Q(#{gdalwarp_path} -t_srs EPSG:#{PROJECTION} #{filepath} #{webmercator_filepath})
      end

      def raster2pgsql_path
        `which raster2pgsql`.strip
      end

      def psql_path
        `which psql`.strip
      end

      def gdalwarp_path
        `which gdalwarp`.strip
      end

    end
  end
end


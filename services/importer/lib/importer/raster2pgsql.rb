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
        reproject_raster

        size = extract_raster_size
        pixel_size = extract_pixel_size

        overviews_list = calculate_raster_overviews(size)
        scale = calculate_raster_scale(pixel_size)

        align_raster(scale)

        run_raster2pgsql(overviews_list)

        run_psql
        self
      end

      private

      attr_writer   :exit_code, :command_output
      attr_accessor :filepath, :pg_options, :table_name, :webmercator_filepath, :aligned_filepath, :sql_filepath, \
                    :basepath

      def align_raster(scale)
        gdalwarp_command = %Q(#{gdalwarp_path} -tr #{scale} -#{scale} #{webmercator_filepath} #{aligned_filepath} )

        stdout, stderr, status  = Open3.capture3(gdalwarp_command)
        output_message = "(#{status}) |#{stdout + stderr}| Command: #{gdalwarp_command}"
        raise TiffToSqlConversionError.new(output_message) if status.to_i != 0
      end

      def reproject_raster
        gdalwarp_command = %Q(#{gdalwarp_path} -t_srs EPSG:#{PROJECTION} #{filepath} #{webmercator_filepath})

        stdout, stderr, status  = Open3.capture3(gdalwarp_command)
        output_message = "(#{status}) |#{stdout + stderr}| Command: #{gdalwarp_command}"
        raise TiffToSqlConversionError.new(output_message) if status.to_i != 0
      end

      # Returns only X pixel size/scale
      def extract_pixel_size
        gdalinfo_command = %Q(#{gdalinfo_path} #{webmercator_filepath})

        stdout, stderr, status  = Open3.capture3(gdalinfo_command)
        output_message = "(#{status}) |#{stdout + stderr}| Command: #{gdalinfo_command}"
        raise TiffToSqlConversionError.new(output_message) if status.to_i != 0

        matches = output_message.match(/pixel size = \((.*)?,/i)
        raise TiffToSqlConversionError.new("Error obtaining raster pixel size: #{output_message}") unless matches[1]
        matches[1].to_f
      end

      def extract_raster_size
        gdalinfo_command = %Q(#{gdalinfo_path} #{webmercator_filepath})

        stdout, stderr, status  = Open3.capture3(gdalinfo_command)
        output_message = "(#{status}) |#{stdout + stderr}| Command: #{gdalinfo_command}"
        raise TiffToSqlConversionError.new(output_message) if status.to_i != 0

        matches = output_message.match(/size is (.*)?\n/i)
        raise TiffToSqlConversionError.new("Error obtaining raster size: #{output_message}") unless matches[1]
        matches[1].split(', ')
                  .map{ |value| value.to_i }
      end

      def run_raster2pgsql(overviews_list)
        stdout, stderr, status  = Open3.capture3(raster2pgsql_command(overviews_list))
        output = stdout + stderr
        output_message = "(#{status}) |#{output}| Command: #{raster2pgsql_command(overviews_list)}"

        raise UnknownSridError.new(output_message)          if output =~ /invalid srid/i
        raise TiffToSqlConversionError.new(output_message)  if status.to_i != 0
        raise TiffToSqlConversionError.new(output_message)  if output =~ /failure/i
      end

      def run_psql
        stdout, stderr, status  = Open3.capture3(psql_command)
        self.command_output     = stdout + stderr
        self.exit_code          = status.to_i
        output_message = "(#{exit_code}) |#{command_output}| Command: #{psql_command}"

        raise TiffToSqlConversionError.new(output_message)  if exit_code != 0
        raise TiffToSqlConversionError.new(output_message)  if command_output =~ /error/i || command_output =~ /aborted/i
      end

      def calculate_raster_scale(pixel_size)
        z0 = 156543.03515625

        factor = z0 / pixel_size

        pw = Math::log(factor) / Math::log(2)
        pow2 = (pw / 1).truncate

        out_scale = z0 / (2 ** pow2)

        out_scale - (out_scale * 0.0001)
      end

      def calculate_raster_overviews(raster_size)
        bigger_size = raster_size.max

        max_power = (Math::log(bigger_size / 256, 2)).ceil.to_i

        range = Range.new(1, max_power + 1)

        overviews = range.map{ |x| 2 ** x }
                         .select { |x| x <= 1000 }

        overviews.join(',')
      end

      def raster2pgsql_command(overviews_list)
        # We currently we don't apply any constraint
        # TODO: Use aligned_filepath, and add overviews list
        %Q(#{raster2pgsql_path} -s #{PROJECTION} -t #{BLOCKSIZE} -Y -I -f the_raster_webmercator ) +
        %Q(-l #{overviews_list} #{aligned_filepath} #{SCHEMA}.#{table_name} > #{sql_filepath})
      end

      def psql_command
        host      = pg_options.fetch(:host)
        port      = pg_options.fetch(:port)
        user      = pg_options.fetch(:user)
        database  = pg_options.fetch(:database)

        %Q(#{psql_path} -h #{host} -p #{port} -U #{user} -d #{database} -f #{sql_filepath})
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

      def gdalinfo_path
        `which gdalinfo`.strip
      end

    end
  end
end


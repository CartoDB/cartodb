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
      OVERLAY_TABLENAME             = 'o_%s_%s'
      RASTER_COLUMN_NAME            = 'the_raster_webmercator'

      def initialize(table_name, filepath, pg_options)
        self.filepath             = filepath
        self.basepath             = filepath.slice(0, filepath.rindex('/')+1)
        self.webmercator_filepath = WEBMERCATOR_FILENAME % [ filepath.gsub(/\.tif$/, '') ]
        self.aligned_filepath     = ALIGNED_WEBMERCATOR_FILENAME % [ filepath.gsub(/\.tif$/, '') ]
        self.pg_options           = pg_options
        self.table_name           = table_name
        self.exit_code            = nil
        self.command_output       = ''
        self.additional_tables    = []
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

        self
      end

      # Returns a list of additional support tables created, that should go to the user DB
      # but not get cartodbfied/shown on the dashboard
      def additional_support_tables
        additional_tables.map { |scale| OVERLAY_TABLENAME % [scale, table_name] }
      end

      private

      attr_writer   :exit_code, :command_output
      attr_accessor :filepath, :pg_options, :table_name, :webmercator_filepath, :aligned_filepath, \
                    :basepath, :additional_tables

      def align_raster(scale)
        gdalwarp_command = %Q(#{gdalwarp_path} -co "COMPRESS=LZW" -tr #{scale} -#{scale} #{webmercator_filepath} #{aligned_filepath} )

        stdout, stderr, status  = Open3.capture3(gdalwarp_command)
        output_message = "(#{status}) |#{stdout + stderr}| Command: #{gdalwarp_command}"
        self.command_output << "\n#{output_message}"
        self.exit_code = status.to_i
        raise TiffToSqlConversionError.new(output_message) if status.to_i != 0
      end

      def reproject_raster
        gdalwarp_command = %Q(#{gdalwarp_path} -co "COMPRESS=LZW" -t_srs EPSG:#{PROJECTION} #{filepath} #{webmercator_filepath})

        stdout, stderr, status  = Open3.capture3(gdalwarp_command)
        output_message = "(#{status}) |#{stdout + stderr}| Command: #{gdalwarp_command}"
        self.command_output << "\n#{output_message}"
        self.exit_code = status.to_i
        raise TiffToSqlConversionError.new(output_message) if status.to_i != 0
      end

      # Returns only X pixel size/scale
      def extract_pixel_size
        gdalinfo_command = %Q(#{gdalinfo_path} #{webmercator_filepath})

        stdout, stderr, status  = Open3.capture3(gdalinfo_command)
        output_message = "(#{status}) |#{stdout + stderr}| Command: #{gdalinfo_command}"
        self.command_output << "\n#{output_message}"
        self.exit_code = status.to_i
        raise TiffToSqlConversionError.new(output_message) if status.to_i != 0

        matches = output_message.match(/pixel size = \((.*)?,/i)
        raise TiffToSqlConversionError.new("Error obtaining raster pixel size: #{output_message}") unless matches[1]
        matches[1].to_f
      end

      def extract_raster_size
        gdalinfo_command = %Q(#{gdalinfo_path} #{webmercator_filepath})

        stdout, stderr, status  = Open3.capture3(gdalinfo_command)
        output_message = "(#{status}) |#{stdout + stderr}| Command: #{gdalinfo_command}"
        self.command_output << "\n#{output_message}"
        self.exit_code = status.to_i
        raise TiffToSqlConversionError.new(output_message) if status.to_i != 0

        matches = output_message.match(/size is (.*)?\n/i)
        raise TiffToSqlConversionError.new("Error obtaining raster size: #{output_message}") unless matches[1]
        matches[1].split(', ')
                  .map{ |value| value.to_i }
      end

      def run_raster2pgsql(overviews_list)
        # We create a pipe and wait for it to complete the transaction in postgres
        # In order to avoid a temporary sql, potentially pretty big
        command = %Q(#{raster2pgsql_command(overviews_list)} | #{psql_base_command})
        stdout, stderr, status  = Open3.capture3(command)
        output = stdout + stderr
        output_message = "(#{status}) |#{output}| Command: #{command}"
        self.command_output << "\n#{output_message}"
        self.exit_code = status.to_i

        if output =~ /canceling statement due to statement timeout/i
          raise StatementTimeoutError.new(output_message, ERRORS_MAP[StatementTimeoutError])
        end

        raise UnknownSridError.new(output_message)          if output =~ /invalid srid/i
        raise TiffToSqlConversionError.new(output_message)  if status.to_i != 0
        raise TiffToSqlConversionError.new(output_message)  if output =~ /failure/i
      end

      def run_psql(command)
        stdout, stderr, status  = Open3.capture3(command)
        output_message = stdout + stderr
        output_message = "(#{status}) |#{output_message}| Command: #{command}"
        self.command_output << "\n#{output_message}"
        self.exit_code = status.to_i

        raise TiffToSqlConversionError.new(output_message)  if exit_code != 0
      end

      def calculate_raster_scale(pixel_size)
        z0 = 156543.03515625

        factor = z0 / pixel_size

        pw = Math::log(factor) / Math::log(2)
        pow2 = pw.ceil

        out_scale = z0 / (2 ** pow2)

        out_scale - (out_scale * 0.0001)
      end

      def calculate_raster_overviews(raster_size)
        bigger_size = raster_size.max

        max_power = (Math::log(bigger_size / 256, 2)).ceil.to_i

        range = Range.new(1, max_power + 1)

        overviews = range.map{ |x| 2 ** x }
                         .select { |x| x <= 1000 }

        self.additional_tables = overviews

        overviews.join(',')
      end

      def raster2pgsql_command(overviews_list)
        %Q(#{raster2pgsql_path} -s #{PROJECTION} -t #{BLOCKSIZE} -C -x -Y -I -f #{RASTER_COLUMN_NAME} ) +
        %Q(-l #{overviews_list} #{aligned_filepath} #{SCHEMA}.#{table_name})
      end

      def psql_inline_command(query)
        psql_base_command %Q(-c "#{query}")
      end

      def psql_base_command(extra_params=nil)
        host      = pg_options.fetch(:host)
        port      = pg_options.fetch(:port)
        user      = pg_options.fetch(:username)
        database  = pg_options.fetch(:database)

        %Q(#{psql_path} -h #{host} -p #{port} -U #{user} -d #{database} #{extra_params})
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


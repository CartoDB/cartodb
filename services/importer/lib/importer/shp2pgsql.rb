# encoding: utf-8
require 'open3'

module CartoDB
  module Importer2
    class NoPrjAvailableError < StandardError; end
    class ShpNormalizationError < StandardError; end

    class Shp2pgsql
      SCHEMA = 'importer'
      NORMALIZER_RELATIVE_PATH = 
        "../../../../../lib/importer/misc/shp_normalizer.py"

      def initialize(table_name, filepath, pg_options, options={})
        self.filepath   = filepath
        self.pg_options = pg_options
        self.table_name = table_name
        self.options    = options
      end #initialize

      def run(*args)
        raise NoPrjAvailableError unless prj?

        normalize
        stdout, stderr, status  = Open3.capture3(command)
        self.command_output     = stdout + stderr
        self.exit_code          = status.to_i
        self
      end #run

      def command
        %Q({ #{statement_timeout } #{shp2pgsql_command} } | #{psql_command})
      end #command

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
        raise ShpNormalizationError unless normalizer_output
        raise ShpNormalizationError unless detected_projection
        self
      end #normalize

      def prj?
        File.exists?(filepath.gsub(%r{\.shp$}, '.prj'))
      end #prj?

      def detected_projection
        projection = normalizer_output.fetch(:projection)
        return nil if projection == 'None'
        projection.to_i
      end #detected_projection

      def detected_encoding
        encoding = normalizer_output.fetch(:encoding)
        return 'LATIN1' if encoding == 'None'
        encoding
      end #detected_encoding

      attr_reader   :exit_code, :command_output, :normalizer_output

      private

      attr_writer   :exit_code, :command_output, :normalizer_output
      attr_accessor :filepath, :pg_options, :options, :table_name

      def python_bin_path
        `which python`.strip
      end #python_bin_path

      def normalizer_path
        File.expand_path(NORMALIZER_RELATIVE_PATH, __FILE__) 
      end #normalizer_path

      def shp2pgsql_path
        `which shp2pgsql`.strip
      end #shp2pgsql_path

      def psql_path
        `which psql`.strip
      end #psql_path

      def statement_timeout
        "echo 'set statement_timeout=600000;';"
      end #statement_timeout

      def normalizer_command
        %Q(#{python_bin_path} -Wignore #{normalizer_path} ) +
        %Q("#{filepath}" #{table_name})
      end #normalizer_command

      def shp2pgsql_command
        %Q(#{shp2pgsql_path} -s #{detected_projection} -D -i ) +
        %Q(-g the_geom -W #{detected_encoding} "#{filepath}" #{table_name};)
      end #shp2pgsql_command

      def psql_command
        host      = pg_options.fetch(:host)
        port      = pg_options.fetch(:port)
        user      = pg_options.fetch(:user)
        database  = pg_options.fetch(:database)

        %Q(#{psql_path} #{host} #{port} -U #{user} -w -d #{database})
      end #psql_command

    end # Shp2pgsql
  end # Importer2
end # CartoDB


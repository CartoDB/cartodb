# encoding: utf-8
require 'open3'

module CartoDB
  module Importer2
    class NoPrjAvailableError < StandardError; end
    class ShpNormalizationError < StandardError; end

    class Shp2pgsql
      ENCODING  = 'UTF-8'
      SCHEMA    = 'importer'

      def initialize(table_name, filepath, pg_options, options={})
        self.filepath   = filepath
        self.pg_options = pg_options
        self.table_name = table_name
        self.options    = options
      end #initialize

      def command
      end #command

      def executable_path
        `which shp2pgsql`.strip
      end #executable_path

      def run(*args)
        raise NoPrjAvailableError unless prj?
        normalize
        #stdout, stderr, status  = Open3.capture3(command)
        #self.command_output     = stdout + stderr
        #self.exit_code          = status.to_i
        #self
      end #run

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

      def normalizer_command
        %Q(#{python_bin_path} -Wignore #{normalizer_path} ) +
        %Q("#{filepath}" #{table_name})
      end #normalizer_command

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
        normalizer_relative_path = "../../../../../lib/importer/misc/shp_normalizer.py"
        File.expand_path(normalizer_relative_path, __FILE__) 
      end #normalizer_path

      def statement_timeout
        "echo 'set statement_timeout=600000;';"
      end #statement_timeout
    end # Shp2pgsql
  end # Importer2
end # CartoDB


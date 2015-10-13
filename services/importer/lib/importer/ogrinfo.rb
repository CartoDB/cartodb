# encoding: utf-8
require 'open3'


module CartoDB
  module Importer2

    # This class is responsible for analyzing a file through ogrinfo.
    class OgrInfo
      DEFAULT_BINARY = `which ogrinfo`.strip

      def initialize(input_file_path)
        @input_file_path = input_file_path
        @executed = false
        @raw_output = nil
      end

      def geometry_type
        /^Geometry: (?<geom>.*)$/ =~ raw_output
        geom
      end

      def geometry_column
        /^Geometry Column = (?<geom_column>.*)$/ =~ raw_output
        geom_column
      end


      private

      def raw_output
        run
      end

      def run
        if !@executed
          stdout, stderr, status = Open3.capture3(command)
          @raw_output = stdout
          @exit_code = status.to_i
          @executed = true
        end
        @raw_output
      end

      def executed?
        @executed
      end

      def command
        "#{DEFAULT_BINARY} #{options.join(' ')} #{@input_file_path}"
      end

      def options
        [
          '-ro',
          '-so',
          '-al',
        ]
      end

    end

  end
end

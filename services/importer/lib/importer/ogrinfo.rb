# encoding: utf-8
require 'open3'

module CartoDB
  module Importer2
    class OgrInfoError < StandardError; end

    # This class is responsible for analyzing a file through ogrinfo.
    class OgrInfo
      DEFAULT_BINARY = `which ogrinfo`.strip

      def initialize(input_file_path, layer)
        @input_file_path = input_file_path
        @layer = layer
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

      def fields
        raw_output
          .split("\n")
          .grep(/^[a-zA-Z0-9_]+:/)
          .reject { |x| x =~ /^(INFO:|Geometry:|Feature Count:|Layer|Extent:)/ }
          .map { |s| s.gsub(/:.*/, '') }
      end

      private

      def raw_output
        run
      end

      def run
        if !@executed
          stdout, _stderr, status = Open3.capture3(command)
          @raw_output = stdout.encode('UTF-8', 'binary', invalid: :replace, undef: :replace, replace: '?')
          @exit_code = status.to_i
          raise OgrInfoError.new(_stderr) if @exit_code != 0
          @executed = true
        end
        @raw_output
      end

      def executed?
        @executed
      end

      def command
        "#{DEFAULT_BINARY} #{options} #{@input_file_path} #{@layer}"
      end

      def options
        [
          '-ro',
          '-so',
          '-al'
        ].join(' ')
      end

    end
  end
end

# encoding: utf-8
require 'open3'
require_relative './source_file'
require_relative './unp'

module CartoDB
  module Importer2
    class KmlSplitter
      def self.support?(source_file)
        source_file.extension == '.kml'
      end

      def initialize(source_file, temporary_directory)
        @source_file          = source_file
        @temporary_directory  = temporary_directory
      end

      def run
        return self unless multiple_layers?(source_file)
        @source_files = source_files_for(source_file, layers_in(source_file))
        self
      end

      def source_files
        return [source_file] unless multiple_layers?(source_file)
        @source_files
      end

      def source_files_for(source_file, layer_names=[])
        layer_names.map { |layer_name|
          extract(path_for(layer_name), source_file, layer_name)
          SourceFile.new(path_for(layer_name))
        }
      end

      def extract(extracted_file_path, source_file, layer_name)
        `ogr2ogr -f 'KML' #{extracted_file_path} #{source_file.fullpath} "#{layer_name}"`
      end

      def multiple_layers?(source_file)
        layers_in(source_file).length > 1
      end

      def layers_in(source_file)
        stdout, stderr, status = 
          Open3.capture3("ogrinfo #{source_file.fullpath}")
        stdout.split("\n")
          .select { |line| line =~ /\A\d/ }
          .map { |line| line.gsub(/\A\d+:\s/, '') }
      end

      def path_for(layer_name)
        File.join(
          temporary_directory,
          Unp.new.underscore(layer_name) + '.kml'
        )
      end

      attr_reader :source_file

      private

      attr_reader :temporary_directory
      attr_writer :source_file
    end # KmlSplitter
  end # Importer2
end # CartoDB
  

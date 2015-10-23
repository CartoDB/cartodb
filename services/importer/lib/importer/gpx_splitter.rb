# encoding: utf-8
require 'open3'
require_relative './source_file'
require_relative './unp'
require_relative './exceptions'

module CartoDB
  module Importer2
    class GpxSplitter
      MAX_LAYERS = 50
      GPX_LAYERS = ['waypoints','routes','tracks','route_points','track_points']
      ITEM_COUNT_REGEX = 'Feature Count:\s'
      def self.support?(source_file)
        source_file.extension == '.gpx'
      end

      def initialize(source_file, temporary_directory)
        @source_file          = source_file
        @temporary_directory  = temporary_directory
      end

      def run
        n_layers = layers_in(source_file).length
        return self if n_layers <= 1
        raise CartoDB::Importer2::TooManyLayersError.new("File has too many layers (#{n_layers}). Maximum number of layers: #{MAX_LAYERS}") if n_layers > MAX_LAYERS
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
          SourceFile.new(path_for(layer_name), nil, layer_name)
        }
      end

      def extract(extracted_file_path, source_file, layer_name)
        `ogr2ogr2 -f 'GPX' -dsco GPX_USE_EXTENSIONS=YES #{extracted_file_path} #{source_file.fullpath} #{layer_name}`
      end

      def multiple_layers?(source_file)
        layers_in(source_file).length > 1
      end

      def layers_in(source_file)
        layers = []
        GPX_LAYERS.each do |layer|
          stdout, stderr, status = Open3.capture3("ogrinfo -so #{source_file.fullpath} #{layer}")
          number_rows = stdout.split("\n")
            .select { |line| line =~ /^#{ITEM_COUNT_REGEX}/}
            .map{ |line| line.gsub(/#{ITEM_COUNT_REGEX}/, '') }.first
          number_rows = Integer(number_rows) rescue nil
          layers << layer if !number_rows.nil? && number_rows > 0
        end
        layers
      end

      def path_for(layer_name)
        File.join(
          temporary_directory,
          Unp.new.underscore(layer_name) + '.gpx'
        )
      end

      attr_reader :source_file

      private

      attr_reader :temporary_directory
      attr_writer :source_file
    end
  end
end

require 'open3'
require_relative './source_file'
require_relative './unp'
require_relative './exceptions'

module CartoDB
  module Importer2
    class KmlSplitter

      MAX_LAYERS = 50
      OGRINFO_BINARY = 'ogrinfo'.freeze
      DEFAULT_OGR2OGR_BINARY = 'ogr2ogr'.freeze

      def self.support?(source_file)
        source_file.extension == '.kml'
      end

      def initialize(source_file, temporary_directory, ogr2ogr_config = nil)
        @source_file          = source_file
        @temporary_directory  = temporary_directory
        @ogr2ogr_binary = if ogr2ogr_config && ogr2ogr_config['binary'].present?
                            `#{ogr2ogr_config['binary']}`.strip
                          else
                            DEFAULT_OGR2OGR_BINARY
                          end
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
          SourceFile.new(path_for(layer_name))
        }
      end

      def extract(extracted_file_path, source_file, layer_name)
        system(@ogr2ogr_binary, '-f', 'KML', extracted_file_path, source_file.fullpath, layer_name)
      end

      def multiple_layers?(source_file)
        layers_in(source_file).length > 1
      end

      def layers_in(source_file)
        stdout, stderr, status =
          Open3.capture3(OGRINFO_BINARY, source_file.fullpath)
        stdout.split("\n")
          .select { |line| line =~ /\A\d/ }
          .map { |line| line.gsub(/\A\d+:\s/, '') }
      end

      def path_for(layer_name)
        File.join(
          temporary_directory,
          "#{Unp.new.underscore(Carto::FileSystem::Sanitize.sanitize_identifier(layer_name))}.kml"
        )
      end

      attr_reader :source_file

      private

      attr_reader :temporary_directory
      attr_writer :source_file

    end
  end
end

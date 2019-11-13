require_relative './source_file'

module CartoDB
  module Importer2
    class OsmSplitter
      LAYER_NAMES = %w{ points lines multilinestrings multipolygons }

      def self.support?(source_file)
        source_file.extension == '.osm'
      end

      def initialize(source_file, temporary_directory = nil, ogr2ogr_config = nil)
        @source_file = source_file
      end

      def run
        self
      end

      def source_files
        LAYER_NAMES.map do |layer_name|
          file = SourceFile.new(
            source_file.send(:filepath),
            "#{source_file.name}_#{layer_name}"
          )
          file.layer = layer_name
          file
        end
      end

      attr_reader :source_file
    end # OsmSplitter
  end # Importer 2
end # CartoDB

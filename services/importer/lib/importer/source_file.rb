module CartoDB
  module Importer2
    class SourceFile
      ENCODING_RE = /_encoding_([\w|-]+)_encoding_.*\./

      def initialize(filepath, filename = nil, layer = nil, http_opts = {})
        @filepath       = filepath
        @filename       = filename
        @etag           = http_opts.fetch(:etag, nil)
        @last_modified  = http_opts.fetch(:last_modified, nil)
        @layer          = layer
        @checksum       = nil
      end

      def name
        File.basename(filename || filepath, extension)
      end

      def extension
        File.extname(filename || filepath)
      end

      def fullpath
        File.join(
          File.dirname(filepath),
          File.basename(filepath, extension) + extension
        )
      end

      def size
        File.size(fullpath)
      end

      def path
        File.basename(fullpath)
      end

      def target_schema
        'cdb_importer'
      end

      def empty?
        File.size(fullpath) == 0
      end

      def encoding
        return nil unless filepath =~ ENCODING_RE
        filepath.match(ENCODING_RE)[1].upcase
      end

      attr_accessor :layer
      attr_reader :filename, :etag, :last_modified, :checksum

      private

      attr_reader :filepath
    end
  end
end

# encoding: utf-8
module CartoDB
  module Importer2
    class SourceFile
      ENCODING_RE = /_encoding_([\w|-]+)_encoding_.*\./

      def initialize(filepath, filename=nil, http_opts={})
        @filepath       = filepath
        @filename       = filename
        @etag           = http_opts.fetch(:etag, nil)
        @last_modified  = http_opts.fetch(:last_modified, nil)
      end #initialize

      def name
        File.basename(filename || filepath, extension)
      end #name

      def extension
        File.extname(filename || filepath)
      end #extension

      def fullpath
        File.join(
          File.dirname(filepath),
          File.basename(filepath, extension) +  extension
        )
      end #fullpath

      def path
        File.basename(fullpath)
      end #path

      def target_schema
        'cdb_importer'
      end #target_schema

      def empty?
        File.size(fullpath) == 0
      end #empty?

      def encoding
        return nil unless filepath =~ ENCODING_RE
        return filepath.match(ENCODING_RE)[1].upcase
      end

      attr_accessor :layer
      attr_reader :filename, :etag, :last_modified, :checksum
      
      private

      attr_reader :filepath
    end # SourceFile
  end # Importer2
end # CartoDB


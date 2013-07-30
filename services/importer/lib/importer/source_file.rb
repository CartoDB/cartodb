# encoding: utf-8
module CartoDB
  module Importer2
    class SourceFile
      def initialize(filepath, filename=nil)
        self.filepath = filepath
        self.filename = filename
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
        return 'public' if extension == '.osm'
        return 'importer'
      end #target_schema

      attr_reader :filename
      
      private

      attr_writer   :filename
      attr_accessor :filepath
    end # SourceFile
  end # Importer2
end # CartoDB


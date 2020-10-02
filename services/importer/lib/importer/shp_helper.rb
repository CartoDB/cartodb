require 'dbf'

module CartoDB
  module Importer2
    class ShpHelper

      attr_reader :filepath, :total_rows, :dbf_encoding

      def initialize(filepath)
        self.filepath = filepath
        verify_file
        extract_dbf_info
      end

      def prj?
        File.exist?(filepath.gsub(/\.shp$/, '.prj'))
      end

      def tab?
        File.extname(filepath) == '.tab'
      end

      def dbf?
        File.exist?(filepath.gsub(/\.shp$/, '.dbf'))
      end

      def shx?
        File.exist?(filepath.gsub(/\.shp$/, '.shx'))
      end

      def verify_file
        raise InvalidShpError unless dbf? && shx?

        # Now we allow prj not present as we'll try to project to 4326
        # raise MissingProjectionError  unless prj?
        true
      end

      def read_encoding_file(extension)
        current_extension = File.extname(filepath)
        path = filepath.gsub(/#{current_extension}$/, ".#{extension}")
        return nil unless File.exist?(path)

        saved_encoding = nil
        f = File.open(path, 'r') do |file|
          saved_encoding = file.read
        end
        saved_encoding
      rescue StandardError => e
        nil
      end

      private

      attr_writer :filepath, :total_rows, :dbf_encoding

      def extract_dbf_info
        dbf = filepath.gsub(/\.shp$/, '.dbf')
        dbf_conn = DBF::Table.new(dbf)
        self.total_rows = dbf_conn.record_count
        self.dbf_encoding = dbf_conn.encoding
      end

    end
  end
end

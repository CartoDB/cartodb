# encoding: utf-8

module CartoDB
  module Importer2
    class Json2Csv
      def initialize(filepath)
        @filepath = filepath
      end #initialize

      def run
        data = parse(filepath)
        return false if complex?(data)
        File.open(converted_filepath, 'w') { |file| file.write csv_from(data) }
        self
      end #run

      def csv_from(data)
        [csv_header_from(data), csv_rows_from(data)].join("\n")
      end #csv_for

      def csv_header_from(data)
        data.first.keys.join(',')
      end #csv_header_from

      def csv_rows_from(data)
        data.map { |row| transform(row) }.join("\n")
      end #csv_rows_from

      def transform(row)
        row.values.map { |value| value.gsub(/"/, "\"") }.join(',')
      end #transform

      def complex?(data)
        data.first.is_a?(Array)
      end #complex?

      def converted_filepath
        File.join(
          File.dirname(filepath),
          File.basename(filepath, File.extname(filepath))
        ) + '.csv'
      end #converted_filepath

      def parse(filepath)
        file  = File.open(filepath)
        data  = ::JSON.parse(file.read.force_encoding('UTF-8'))
        file.close
        data
      end #parse

      private

      attr_reader :filepath
    end # Json2Csv
  end # Imporer2
end # CartoDB


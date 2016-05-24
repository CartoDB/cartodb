# encoding: utf-8
require_relative './job'

module CartoDB
  module Importer2
    class Json2Csv
      def self.supported?(extension)
        extension == '.json'
      end

      def initialize(filepath, job=nil, logger=nil)
        @filepath = filepath
        @job      = job || Job.new({logger: logger})
      end

      def run
        data = parse(filepath)
        return self if complex?(data)
        File.open(converted_filepath, 'w') { |file| file.write csv_from(data) }
        job.log 'Converting JSON to CSV'
        self
      rescue
        raise InvalidGeoJSONError.new(@job.logger)
      end

      def csv_from(data)
        [csv_header_from(data), csv_rows_from(data)].join("\n")
      end

      def csv_header_from(data)
        data.first.keys.join(',')
      end

      def csv_rows_from(data)
        data.map { |row| transform(row) }.join("\n")
      end

      def transform(row)
        row.values.map { |value| value.to_s.gsub(/,/, '').gsub(/"/, "\"") }
          .join(',')
      end

      def complex?(data)
        data.first.is_a?(Array)
      end

      def converted_filepath
        return filepath if complex?(parse(filepath))
        File.join(
          File.dirname(filepath),
          File.basename(filepath, File.extname(filepath))
        ) + '.csv'
      end

      def parse(filepath)
        return {} unless File.exists?(filepath)
        file  = File.open(filepath)
        data  = ::JSON.parse(file.read.force_encoding('UTF-8'))
        file.close
        data
      end

      private

      attr_reader :filepath, :job
    end
  end
end


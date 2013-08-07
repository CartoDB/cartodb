# encoding: utf-8
require 'csv'
require 'simple_xlsx_reader'
require_relative './job'

module CartoDB
  module Importer2
    class Xlsx2Csv
      def initialize(filepath, job=nil)
        @filepath = filepath
        @job      = job || Job.new
      end #initialize

      def run
        ::CSV.open(converted_filepath, 'w') do |csv|
          xlsx.sheets.each { |sheet| 
            sheet.rows.each { |row| csv << row }
          }
        end

        job.log 'Converting XSLX to CSV'
        self
      end #run

      def xlsx
        @xlsx ||= SimpleXlsxReader.open(filepath)
      end #xlsx

      def converted_filepath
        File.join(
          File.dirname(filepath),
          File.basename(filepath, File.extname(filepath))
        ) + '.csv'
      end #converted_filepath

      private

      attr_reader :filepath, :job
    end #Xlsx2Csv
  end # Importer2
end # CartoDB


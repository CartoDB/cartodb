# encoding: utf-8
require 'csv'
require 'roo'
require_relative './job'
require_relative './csv_normalizer'

module CartoDB
  module Importer2
    class Xlsx2Csv
      def self.supported?(extension)
        extension == '.xlsx'
      end #self.supported?

      def initialize(filepath, job=nil)
        @filepath = filepath
        @job      = job || Job.new
      end #initialize

      def run
        job.log 'Converting XSLX to CSV'
        spreadsheet = Roo::Spreadsheet.open(filepath)
        job.log "Orig file: #{filepath}\nTemp destination: #{converted_filepath}"
        spreadsheet.to_csv(converted_filepath)
        CsvNormalizer.new(converted_filepath, job).run
        self
      end #run

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


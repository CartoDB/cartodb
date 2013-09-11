# encoding: utf-8
require 'csv'
require 'roo'
require_relative './job'
require_relative './csv_normalizer'

module CartoDB
  module Importer2
    class Xls2Csv
      def self.supported?(extension)
        extension == '.xls'
      end #self.supported?

      def initialize(filepath, job=nil)
        @filepath = filepath
        @job      = job || Job.new
      end #initialize

      def run
        job.log 'Converting XLS to CSV'
        spreadsheet = Roo::Spreadsheet.open(filepath)
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
    end #Xls2Csv
  end # Importer2
end # CartoDB


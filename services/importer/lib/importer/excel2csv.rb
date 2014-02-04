# encoding: utf-8
require 'csv'
require 'roo'
require_relative './job'
require_relative './csv_normalizer'

module CartoDB
  module Importer2
    class Excel2Csv
      def self.supported?(extension)
        extension == ".#{@format}"
      end #self.supported?

      def initialize(supported_format, filepath, job=nil)
        @format = "#{supported_format.downcase}"
        @filepath = filepath
        @job      = job || Job.new
      end #initialize

      def run
        job.log "Converting #{@format.upcase} to CSV"
        spreadsheet = Roo::Spreadsheet.open(filepath)

        spreadsheet.default_sheet = spreadsheet.sheets.first
        spreadsheet.first_row.upto(spreadsheet.last_row) { |current_row| 
          spreadsheet.first_column.upto(spreadsheet.last_column) { |current_col|
            if (spreadsheet.celltype(current_row, current_col) == :string)
              current_value = spreadsheet.cell(current_row,current_col)
              # As we are going to export to CSV, remove newlines or will cause problems (even being quoted)
              if (current_value.index("\n") != nil)
                spreadsheet.set(current_row, current_col, current_value.gsub("\n",''))
              end
            end
          }
        }

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

      protected

      attr_reader :filepath, :job
    end #Excel2Csv
  end # Importer2
end # CartoDB


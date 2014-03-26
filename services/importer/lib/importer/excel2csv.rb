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

        spreadsheet = remove_newlines(spreadsheet)

        # Can be check locally using wc -l ... (converted_filepath)
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

      def remove_newlines(spreadsheet)
        job.log 'Removing newlines...'
        spreadsheet.default_sheet = spreadsheet.sheets.first
        job.log 'Processing first sheet'

        job.log 'Calculating columns (this can take long as will scan the full document)'
        col_count = spreadsheet.sheet(0).last_column
        job.log 'Calculating rows'
        row_count = spreadsheet.sheet(0).last_row

        for row_index in 1..row_count
          for col_index in 1..col_count
            if spreadsheet.celltype(row_index, col_index) == :string
              current_value = spreadsheet.cell(row_index,col_index)
              # As we are going to export to CSV, remove newlines or will cause problems (even being quoted)
              if current_value.index("\n") != nil
                spreadsheet.set(row_index, col_index, current_value.gsub("\n",''))
              end
            end
          end
        end

        job.log 'Newlines removed'
        spreadsheet
      rescue NoMethodError
        raise XLSXFormatError
      end #remove_newlines

      attr_reader :filepath, :job
    end #Excel2Csv
  end # Importer2
end # CartoDB


# encoding: utf-8
require 'csv'
require_relative './job'
require_relative './csv_normalizer'

module CartoDB
  module Importer2
    class Excel2Csv

      NEWLINE_REMOVER_RELPATH = "../../../../../lib/importer/misc/csv_remove_newlines.py"

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
        %x[in2csv #{filepath} | #{newline_remover_path} > #{converted_filepath}]

        # Can be check locally using wc -l ... (converted_filepath)
        job.log "Orig file: #{filepath}\nTemp destination: #{converted_filepath}"
        normalizer = CsvNormalizer.new(converted_filepath, job)
        # Roo gem is not exporting always correctly when source Excel has atypical UTF-8 characters
        normalizer.force_normalize
        normalizer.run
        self
      end #run

      def converted_filepath
        File.join(
          File.dirname(filepath),
          File.basename(filepath, File.extname(filepath))
        ) + '.csv'
      end #converted_filepath

      protected

      def newline_remover_path
        File.expand_path(NEWLINE_REMOVER_RELPATH, __FILE__)
      end

      attr_reader :filepath, :job
    end #Excel2Csv
  end # Importer2
end # CartoDB

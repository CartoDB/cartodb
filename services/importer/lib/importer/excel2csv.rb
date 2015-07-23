# encoding: utf-8
require 'csv'
require 'open3'
require_relative './job'
require_relative './csv_normalizer'
require_relative './exceptions'

module CartoDB
  module Importer2
    class Excel2Csv

      NEWLINE_REMOVER_RELPATH = "../../../../../lib/importer/misc/csv_remove_newlines.py"

      IN2CSV_WARNINGS = [ "WARNING *** OLE2 inconsistency: SSCS size is 0 but SSAT size is non-zero",
        "*** No CODEPAGE record, no encoding_override: will use 'ascii'"]

      class UnsupportedOrCorruptFile < StandardError; end

      def self.supported?(extension)
        extension == ".#{@format}"
      end #self.supported?

      def initialize(supported_format, filepath, job=nil, csv_normalizer=nil)
        @format = "#{supported_format.downcase}"
        @filepath = filepath
        @job      = job || Job.new
        @csv_normalizer = csv_normalizer || CsvNormalizer.new(converted_filepath, @job)
      end #initialize

      def run
        job.log "Converting #{@format.upcase} to CSV"

        Open3.popen3("file -b --mime-type #{filepath}") do |stdin, stdout, stderr, process|
          @file_mime_type = stdout.read.delete("\n")
          job.log "Can't get the mime type of the file" unless process.value.to_s =~ /exit 0/
        end

        # Take into account that here should come or csv files with xls extensions or xls documents
        file_format = (@file_mime_type == "text/plain") ? "-f csv" : ""
        in2csv_command_line = %Q[in2csv #{filepath} #{file_format} | #{in2csv_warning_filter} | #{newline_remover_path} > #{converted_filepath}]
        job.log "About to execute in2csv: " + in2csv_command_line
        Open3.popen3(in2csv_command_line) do |stdin, stdout, stderr, process|
          raise CartoDB::Importer2::MalformedXLSException.new if stderr.read =~ /Unsupported format, or corrupt file:/
          job.log "done executing in2csv."
        end


        # Can be check locally using wc -l ... (converted_filepath)
        job.log "Orig file: #{filepath}\nTemp destination: #{converted_filepath}"
        # Roo gem is not exporting always correctly when source Excel has atypical UTF-8 characters
        @csv_normalizer.force_normalize
        @csv_normalizer.run
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

      def in2csv_warning_filter
        IN2CSV_WARNINGS.map { |w| "grep -v \"#{w.gsub('*', "\\*")}\"" }.join(' | ')
      end

      attr_reader :filepath, :job
    end #Excel2Csv
  end # Importer2
end # CartoDB

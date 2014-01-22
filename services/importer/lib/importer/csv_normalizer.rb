# encoding: utf-8
require 'csv'
require 'charlock_holmes'
require 'tempfile'
require 'fileutils'
require_relative './job'
require_relative './source_file'

module CartoDB
  module Importer2
    class CsvNormalizer
      LINE_LIMIT            = 1000      # Max line size
      SAMPLE_READ_LIMIT     = 2000000   # Read big enough sample bytes for the encoding sampling
      COMMON_DELIMITERS     = [',', "\t", ' ', ';']
      DEFAULT_DELIMITER     = ','
      DEFAULT_ENCODING      = 'UTF-8'
      ENCODING_CONFIDENCE   = 30 
      ACCEPTABLE_ENCODINGS  = %w{ ISO-8859-1 ISO-8859-2 UTF-8 }

      def self.supported?(extension)
        %w(.csv .tsv .txt).include?(extension)
      end #self.supported?

      def initialize(filepath, job=nil)
        @filepath = filepath
        @job      = job || Job.new
      end #initialize

      def normalize(temporary_filepath)
        temporary_csv = ::CSV.open(temporary_filepath, 'w', col_sep: ',')

        File.open(filepath, 'rb', external_encoding: encoding)
        .each_line(line_delimiter) { |line| 
          row = parsed_line(line)
          next unless row
          temporary_csv << multiple_column(row)
        }

        temporary_csv.close
      rescue ArgumentError
        raise EncodingDetectionError
      end

      def parsed_line(line)
        ::CSV.parse_line(line.chomp.encode('UTF-8'), csv_options)
      rescue => exception
        nil
      end

      def run
        return self unless File.exists?(filepath) && needs_normalization?
        normalize(temporary_filepath)
        release
        File.rename(temporary_filepath, filepath)
        FileUtils.rm_rf(temporary_directory)
        self.temporary_directory = nil
        self
      end #run

      def temporary_filepath
        File.join(temporary_directory, File.basename(filepath))
      end #temporary_path

      def csv_options
        {
          col_sep:            delimiter,
          quote_char:         '"'
        }
      end #csv_options

      def line_delimiter
        return "\r" if windows_eol?
        return $/ 
      end #line_delimiter

      def windows_eol?
        return false if first_line =~ /\n/
        !!(first_line =~ %r{\r})
      end #windows_eol?

      def needs_normalization?
        (!ACCEPTABLE_ENCODINGS.include?(encoding))  || 
        (delimiter != DEFAULT_DELIMITER)            ||
        single_column?                              
      end #needs_normalization?

      def single_column?
        ::CSV.parse(first_line, csv_options).first.length < 2
      end #single_column?

      def multiple_column(row)
        return row if row.length > 1
        row << nil
      end #multiple_column

      def temporary_directory
        generate_temporary_directory unless @temporary_directory
        @temporary_directory
      end #temporary_directory

      def generate_temporary_directory
        tempfile                  = Tempfile.new("")
        self.temporary_directory  = tempfile.path

        tempfile.close!
        Dir.mkdir(temporary_directory)
        self
      end #generate_temporary_directory

      def magic_formula_to_detect_comma_separator(occurrences)
        comma_score     = occurrences[',']
        highest_score   = occurrences.first.last

        comma_score >= highest_score / 2
      end #magic_formula_to_detect_comma_separator

      def delimiter
        return @delimiter if @delimiter
        return DEFAULT_DELIMITER unless first_line
        occurrences = Hash[
          COMMON_DELIMITERS.map { |delimiter| 
            [delimiter, first_line.squeeze(delimiter).count(delimiter)] 
          }.sort {|a, b| b.last <=> a.last }
        ]

        @delimiter = ',' if magic_formula_to_detect_comma_separator(occurrences)
        @delimiter ||= occurrences.first.first unless occurrences.empty?
      end #delimiter_in

      def encoding
        source_file = SourceFile.new(filepath)
        return source_file.encoding if source_file.encoding

        data    = File.open(filepath, 'r')
        sample  = data.read(SAMPLE_READ_LIMIT);
        data.close

        result = CharlockHolmes::EncodingDetector.detect(sample)
        if result.fetch(:confidence, 0) < ENCODING_CONFIDENCE
          return DEFAULT_ENCODING
        end
        result.fetch(:encoding, DEFAULT_ENCODING)
      rescue
        DEFAULT_ENCODING
      end #encoding

      def first_line
        return @first_line if @first_line
        stream.rewind
        @first_line ||= stream.gets(LINE_LIMIT)
      end #first_line

      def release
        @delimiter = nil
        @stream.close
        @stream = nil
        @first_line = nil
        self
      end #release

      def stream
        @stream ||= File.open(filepath, 'rb')
      end #stream

      def column_count
        ::CSV.parse(first_line, col_sep: delimiter).first
      end #column_count

      attr_reader   :filepath
      alias_method  :converted_filepath, :filepath

      private

      attr_writer :temporary_directory
    end # CsvNormalizer
  end #Importer2
end # CartoDB


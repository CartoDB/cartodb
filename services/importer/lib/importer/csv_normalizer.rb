# encoding: utf-8
require 'csv'
require 'charlock_holmes'
require 'tempfile'
require 'fileutils'

module CartoDB
  module Importer2
    class CsvNormalizer
      COMMON_DELIMITERS = [',', "\t", ' ']
      DEFAULT_DELIMITER = ','
      DEFAULT_ENCODING  = "UTF-8"

      def initialize(filepath)
        @filepath = filepath
      end #initialize

      def normalize
        return self unless File.exists?(filepath)
        return self unless filepath =~ /\.csv/ && needs_normalization?
        temporary_csv = CSV.open(temporary_filepath, 'w', col_sep: ',')
        csv_options   = { external_encoding: encoding, col_sep: delimiter }
        stream.rewind
        ::CSV.new(stream, csv_options).each { |row| temporary_csv << (row) }

        temporary_csv.close
        release
        File.rename(temporary_filepath, filepath)
        FileUtils.rm_rf(temporary_directory)
        self.temporary_directory = nil
        self
      end #normalize

      def temporary_filepath
        File.join(temporary_directory, File.basename(filepath))
      end #temporary_path

      def needs_normalization?
        (encoding != DEFAULT_ENCODING) || (separator != DEFAULT_DELIMITER)
      end #needs_normalization?

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

      def delimiter
        return DEFAULT_DELIMITER unless first_line
        occurrences = Hash[
          COMMON_DELIMITERS.map { |delimiter| 
            [delimiter, first_line.squeeze(delimiter).count(delimiter)] 
          }
        ].sort {|a, b| b.last <=> a.last }

        #delimiter = ' ' if delimiter == "\"\t\""
        occurrences.first.first unless occurrences.empty?
      end #delimiter_in

      def encoding
        data      = File.open(filepath, 'r')
        encoding  = CharlockHolmes::EncodingDetector.detect(data.first)
                      .fetch(:encoding)
        data.close
        encoding
      end #encoding

      def first_line
        stream.rewind
        stream.first.encode('UTF-8', encoding)
      end #first_line

      def release
        @stream.close
        @stream = nil
        self
      end #release

      def stream
        @stream ||= File.open(filepath, 'rb', external_encoding: encoding)
      end #stream

      def column_count
        ::CSV.parse(first_line, col_sep: delimiter).first
      end #column_count

      attr_reader :filepath

      private

      attr_writer :temporary_directory
    end # CsvNormalizer
  end #Importer2
end # CartoDB


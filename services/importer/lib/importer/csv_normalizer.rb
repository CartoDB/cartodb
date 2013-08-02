# encoding: utf-8
require 'csv'
require 'charlock_holmes'

module CartoDB
  module Importer2
    class CsvNormalizer
      COMMON_DELIMITERS = ['","',"\"\t\"", '" "']
      DEFAULT_DELIMITER = ','

      def initialize(filepath)
        @filepath = filepath
      end #initialize

      def to_utf8
        
      end #to_utf8 

      def to_comma_delimiter
      end #to_comma_delimiter

      def delimiter
        return DEFAULT_DELIMITER unless first_line
        occurrences = Hash[
          COMMON_DELIMITERS.map { |delimiter| 
            [delimiter, first_line.count(delimiter)] 
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

      def stream
        @stream ||= File.open(filepath, 'rb', external_encoding: encoding)
      end #stream

      def column_count
        ::CSV.parse(first_line, col_sep: delimiter).first
      end #column_count

      attr_reader :filepath
    end # CsvNormalizer
  end #Importer2
end # CartoDB


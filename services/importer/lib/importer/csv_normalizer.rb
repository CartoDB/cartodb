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
      LINES_FOR_DETECTION   = 100       # How many lines to read?
      SAMPLE_READ_LIMIT     = 500000   # Read big enough sample bytes for the encoding sampling
      COMMON_DELIMITERS     = [',', "\t", ' ', ';']
      DELIMITER_WEIGHTS     = {','=>2, "\t"=>2, ' '=>1, ';'=>2}
      DEFAULT_DELIMITER     = ','
      DEFAULT_ENCODING      = 'UTF-8'
      DEFAULT_QUOTE         = '"'
      OUTPUT_DELIMITER      = ','       # Normalized CSVs will use this delimiter
      ENCODING_CONFIDENCE   = 30 
      ACCEPTABLE_ENCODINGS  = %w{ ISO-8859-1 ISO-8859-2 UTF-8 }


      def initialize(filepath, job=nil)
        @filepath = filepath
        @job      = job || Job.new
        @delimiter = nil
      end #initialize

      def run
        return self unless File.exists?(filepath)

        sanitized_filepath = remove_newlines(temporary_filepath('nl_'))
        File.rename(sanitized_filepath, filepath)

        detect_delimiter()

        return self unless needs_normalization?

        normalize(temporary_filepath())
        release()
        File.rename(temporary_filepath(), filepath)
        FileUtils.rm_rf(temporary_directory)
        self.temporary_directory = nil
        self
      end #run

      def detect_delimiter

        # Calculate variances of the N first lines for each delimiter, then grab the one that changes less
        @delimiter = DEFAULT_DELIMITER unless first_line

        lines_for_detection = Array.new

        LINES_FOR_DETECTION.times { 
          line = stream.gets 
          lines_for_detection << line unless line.nil?
        }

        stream.rewind

        # Maybe gets was not able to discern line breaks, try manually:
        if lines_for_detection.size == 1
          lines_for_detection = lines_for_detection.first
          # Did it read as columns instead of rows?
          if (lines_for_detection.class == Array)
            lines_for_detection.first
          end
          # Carriage return without newline
          lines_for_detection = lines_for_detection.split("\x0D")
        end

        occurrences = Hash[
          COMMON_DELIMITERS.map { |delimiter| 
            [delimiter, lines_for_detection.map { |line| 
              line.count(delimiter) }] 
          }
        ]

        stream.rewind

        variances = Hash.new
        @delimiter = DEFAULT_DELIMITER
        
        use_variance = true
        occurrences.each { |key, values| 
          if values.length > 1
            variances[key] = sample_variance(values) unless values.first == 0
          elsif values.length == 1
            # If only detected a single line of data, cannot use variance
            variances[key] = values.first * DELIMITER_WEIGHTS[key]
            use_variance = false
          else
            use_variance = false
          end
        }

        if variances.length > 0
          if use_variance
            @delimiter = variances.sort {|a, b| a.last <=> b.last }.first.first
          else
            # Use whatever delimiter appears more and hope for the best
            @delimiter = variances.sort {|a, b| b.last <=> a.last }.first.first
          end
        end

        @delimiter
      end #detect_delimiter

      def self.supported?(extension)
        %w(.csv .tsv .txt).include?(extension)
      end #self.supported?

      def normalize(temporary_filepath)
        temporary_csv = ::CSV.open(temporary_filepath, 'w', col_sep: OUTPUT_DELIMITER)

        File.open(filepath, 'rb', external_encoding: encoding)
        .each_line(line_delimiter) { |line| 

          row = parsed_line(line)
          next unless row
          temporary_csv << multiple_column(row)
        }

        temporary_csv.close

        @delimiter = OUTPUT_DELIMITER
      rescue ArgumentError
        raise EncodingDetectionError
      end

      def parsed_line(line)
        ::CSV.parse_line(line.chomp.encode('UTF-8'), csv_options)
      rescue => exception
        nil
      end

      def temporary_filepath(filename_prefix = '')
        File.join(temporary_directory, filename_prefix + File.basename(filepath))
      end #temporary_path

      def csv_options
        {
          col_sep:            delimiter,
          quote_char:         DEFAULT_QUOTE
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

      def delimiter
        return @delimiter
      end #delimiter

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
        @first_line ||= stream.gets
        stream.rewind
      end #first_line

      def release
        @stream.close
        @stream = nil
        @first_line = nil
        self
      end #release

      def stream
        @stream ||= File.open(filepath, 'rb')
      end #stream

      # Attempts to 
      def remove_newlines(temporary_filepath)
        sanitized_file = File.open(temporary_filepath, 'wb')

        aggregated_line = ''
        opened_quotes = 0
        File.open(filepath, 'rb')
            .each_line(line_delimiter) { |line| 

          line.each_char { |character|
            if (character == "\"")
              opened_quotes += 1
            end
            if (character != "\n")
              aggregated_line += character
            end
          }

          if (opened_quotes % 2 == 0)
            sanitized_file << (aggregated_line + "\n")
            aggregated_line = ''
            opened_quotes = 0
          end
        }

        sanitized_file.close

        temporary_filepath
      end

      attr_reader   :filepath
      alias_method  :converted_filepath, :filepath

      private

      def generate_temporary_directory
        tempfile                  = Tempfile.new("")
        self.temporary_directory  = tempfile.path

        tempfile.close!
        Dir.mkdir(temporary_directory)
        self
      end #generate_temporary_directory

      def temporary_directory
        generate_temporary_directory unless @temporary_directory
        @temporary_directory
      end #temporary_directory

      def sum(items_list)
        items_list.inject(0){|accum, i| accum + i }
      end #sum

      def mean(items_list)
        sum(items_list) / items_list.length.to_f
      end #mean

      def sample_variance(items_list)
        m = mean(items_list)
        sum = items_list.inject(0){|accum, i| accum +(i-m)**2 }
        sum / (items_list.length - 1).to_f
      end #sample_variance

      attr_writer :temporary_directory

    end # CsvNormalizer
  end #Importer2
end # CartoDB


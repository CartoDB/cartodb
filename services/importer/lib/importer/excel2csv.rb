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
      end

      def initialize(supported_format, filepath, job=nil, csv_normalizer=nil, importer_config = nil)
        @format = "#{supported_format.downcase}"
        @filepath = filepath
        @job      = job || Job.new
        @importer_config = importer_config
        @csv_normalizer = csv_normalizer || CsvNormalizer.new(converted_filepath, @job, @importer_config)
      end

      def run
        job.log "Converting #{@format.upcase} to CSV"

        Open3.popen3('file', '-b', '--mime-type', filepath) do |stdin, stdout, stderr, process|
          file_mime_type = stdout.read.delete("\n")
          job.log "Can't get the mime type of the file" unless process.value.to_s =~ /exit 0/
          # CSV files with XLS extensions are considered malformed files
          raise CartoDB::Importer2::MalformedXLSException.new if file_mime_type == "text/plain"
        end

        err_r, err_w = IO.pipe
        output = File.open(converted_filepath, 'w')
        Open3.pipeline_start([in2csv_command, filepath], *in2csv_warning_filter, newline_remover_command,
                             err: err_w, out: output) do
          err_w.close
          raise CartoDB::Importer2::MalformedXLSException.new if err_r.read =~ /Unsupported format, or corrupt file:/
          job.log "done executing in2csv."
        end

        # Can be check locally using wc -l ... (converted_filepath)
        job.log "Orig file: #{filepath}\nTemp destination: #{converted_filepath}"
        # Roo gem is not exporting always correctly when source Excel has atypical UTF-8 characters
        @csv_normalizer.force_normalize
        @csv_normalizer.run
        self
      end

      def converted_filepath
        File.join(
          File.dirname(filepath),
          File.basename(filepath, File.extname(filepath))
        ) + '.csv'
      end

      protected

      def newline_remover_path
        File.expand_path(NEWLINE_REMOVER_RELPATH, __FILE__)
      end

      def in2csv_warning_filter
        IN2CSV_WARNINGS.map { |w| ['grep', '-v', w.gsub('*', "\\*")] }
      end

      def newline_remover_command
        [CartoDB.python_bin_path, newline_remover_path]
      end

      def in2csv_command
        python_path = CartoDB.python_path
        if python_path.empty?
          "in2csv"
        else
          "#{python_path}/in2csv"
        end
      end

      attr_reader :filepath, :job
    end
  end
end

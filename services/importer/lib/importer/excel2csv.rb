# encoding: utf-8
require 'csv'
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

        # Can be check locally using wc -l ... (converted_filepath)
        job.log "Orig file: #{filepath}\nTemp destination: #{converted_filepath}"

        # --ignoreempty: skip empty lines
        # --escape: Escape \r\n\t characters
        # --dateformat: specify a standardized dateformat (ISO 8601)
        `xlsx2csv --ignoreempty --escape --dateformat '%Y-%m-%dT%H:%M:%S' #{filepath} #{converted_filepath}`

        # Normalize here for consistency's sake
        normalizer = CsvNormalizer.new(converted_filepath, job)
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

      attr_reader :filepath, :job
    end #Excel2Csv
  end # Importer2
end # CartoDB


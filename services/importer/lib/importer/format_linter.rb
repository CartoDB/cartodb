require_relative './job'

module CartoDB
  module Importer2
    class FormatLinter
      CHARACTER_LIMIT = 1000

      def self.supported?(extension)
        extension == '.kml'
      end

      # INFO: importer_config not used but needed for compatibility with other normalizers
      def initialize(filepath, job = nil, importer_config = nil)
        @filepath = filepath
        @job      = job || Job.new
      end

      def run
        data    = File.open(filepath, 'r')
        sample  = data.read(CHARACTER_LIMIT)
        data.close

        raise KmlNetworkLinkError if sample =~ /NetworkLink.*href.*NetworkLink/m
        self
      end

      def converted_filepath
        filepath
      end

      private

      attr_reader :filepath, :job
    end # FormatLinter
  end # Importer2
end # CartoDB


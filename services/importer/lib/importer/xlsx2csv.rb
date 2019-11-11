require_relative './excel2csv'

module CartoDB
  module Importer2
    class Xlsx2Csv < Excel2Csv

      SUPPORTED_EXTENSION = 'xlsx'

      def self.supported?(extension)
        extension == ".#{SUPPORTED_EXTENSION}"
      end

      def initialize(filepath, job = nil, importer_config = nil)
        super(SUPPORTED_EXTENSION, filepath, job, nil, importer_config)
      end

    end
  end
end

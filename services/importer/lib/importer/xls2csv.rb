# encoding: utf-8
require_relative './excel2csv'

module CartoDB
  module Importer2
    class Xls2Csv < Excel2Csv
      
      SUPPORTED_EXTENSION = 'xls'

      def self.supported?(extension)
        extension == ".#{SUPPORTED_EXTENSION}"
      end #self.supported?

      def initialize(filepath, job=nil)
        super(SUPPORTED_EXTENSION, filepath, job)
      end #initialize

    end #Xls2Csv
  end # Importer2
end # CartoDB

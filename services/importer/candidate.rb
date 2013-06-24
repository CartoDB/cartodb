# encoding: utf-8

module CartoDB
  module Importer
    class Candidate
      def initialize(attributes={})
        self.name       = attributes.fetch(:name, nil)
        self.extension  = attributes.fetch(:extension, nil)
        self.fullpath   = attributes.fetch(:fullpath, nil)
        self.filepath   = attributes.fetch(:filepath, nil)
      end #initialize

      attr_reader :name, :extension, :filepath, :fullpath
      
      private

      attr_writer :name, :extension, :filepath, :fullpath
    end # Candidate
  end # Importer
end # CartoDB


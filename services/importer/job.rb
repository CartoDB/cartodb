# encoding: utf-8
require 'uuidtools'
require_relative './loader'
require_relative '../track_record/track_record'

module CartoDB
  module Importer
    class Job
      def initialize(connection, filepath, loader=nil)
        self.id     = UUIDTools::UUID.timestamp_create
        self.log    = TrackRecord::Log.new
        @filepath   = filepath
        self.loader = loader || loader_for(connection, log)
      end #initialize

      def run
        log.append "Importing file #{filepath}"
        exit_code = loader.run(filepath)
        log.append "Loader exited with code #{exit_code}"

        exit_code
      end #run

      attr_reader :log, :id

      private

      attr_reader :filepath, :loader
      attr_writer :log, :id, :loader

      def loader_for(connection, log)
        Loader.new(connection, log)
      end #loader_for
    end # Job
  end # Importer
end # CartoDB


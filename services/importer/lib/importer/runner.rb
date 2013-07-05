# encoding: utf-8
require_relative './loader'
require_relative './georeferencer'

module CartoDB
  module Importer2
    class Runner
      def initialize(job, downloader, georeferencer=nil)
        self.job          = job
        self.downloader   = downloader
        @georeferencer    ||= Georeferencer.new(job.db, job.table_name)
        self.loader       = nil
      end #initialize

      def run
        job.log "Starting import with job ID: #{job.id}"
        job.log "Getting file from #{downloader.url}"
        downloader.run
        job.log "Importing data from #{downloader.source_file.fullpath}"
        loader.run
        job.log "Loader exit code: #{loader.exit_code}"
        puts report
        georeferencer.run
        self
      end #run
      
      def report
        job.logger.to_s
      end #report

      def results
        [
          { 
            name:       downloader.source_file.name,
            table_name: job.table_name
          } 
        ]
      end #results

      def exit_code
        loader.exit_code
      end #exit_code

      private

      attr_accessor :job, :downloader, :georeferencer
      attr_writer   :loader

      def loader
        @loader ||= Loader.new(job, source_file)
      end #loader

      def source_file
        downloader.source_file
      end #source_file
    end # Runner
  end # Importer2
end # CartoDB


# encoding: utf-8
require_relative './loader'

module CartoDB
  module Importer2
    class Runner
      def initialize(job, downloader)
        self.job        = job
        self.downloader = downloader
        @loader         = nil
      end #initialize

      def run
        job.log "Starting import with job ID: #{job.id}"
        job.log "Getting file from #{downloader.url}"
        downloader.run
        job.log "Importing data from #{downloader.source_file.fullpath}"
        loader.run
        job.log "Loader exit code: #{loader.exit_code}"
        self
      end #run
      
      def report
        job.logger.to_s
      end #report

      def exit_code
        loader.exit_code
      end #exit_code

      private

      attr_accessor :job, :downloader, :loader

      def loader
        @loader ||= Loader.new(job, source_file)
      end #loader

      def source_file
        downloader.source_file
      end #source_file
    end # Runner
  end # Importer2
end # CartoDB


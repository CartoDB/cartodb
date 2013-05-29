# encoding: utf-8
require 'forwardable'
require 'uuidtools'
require_relative './job'
require_relative './loader'
require_relative '../track_record/track_record'

module CartoDB
  module Importer
    class Runner
      extend Forwardable

      def initialize(connection, filepath, loader=nil)
        self.job    = Job.new(
          filepath:   filepath,
          connection: connection,
          id:         UUIDTools::UUID.timestamp_create,
          logger:     TrackRecord::Log.new
        )
        self.loader = loader || Loader.new(job)
      end #initialize

      def run
        log "Importing file #{filepath}"
        exit_code = loader.run(filepath)
        log "Loader exited with code #{exit_code}"

        exit_code
      end #run

      attr_reader :job

      private

      attr_accessor :loader
      attr_writer   :job

      def_delegators :job, :log, :id, :connection, :filepath
    end # Runner
  end # Importer
end # CartoDB


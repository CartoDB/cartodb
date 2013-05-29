# encoding: utf-8
require 'sqlite3'
require_relative '../track_record/track_record'

module CartoDB
  module Importer
    class Job
      def initialize(connection, filepath)
        @connection = connection
        @filepath   = filepath
        self.log    = TrackRecord::Log.new
      end #initialize

      def run
        log.append "Using database connection #{connection}"
        log.append "Importing file #{filepath}"
        return 0
      end #run

      attr_reader :log

      private

      attr_reader :connection, :filepath
      attr_writer :log
    end # Job
  end # Importer
end # CartoDB


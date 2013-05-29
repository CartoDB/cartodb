# encoding: utf-8
require_relative '../track_record/track_record'

module CartoDB
  module Importer
    class Loader
      def initialize(connection, log=TrackRecord::Log.new)
        @connection = connection
        @log        = log
      end #initialize

      def run(*args)
        log.append "Using database connection #{connection}"
        return 0
      end #run

      attr_reader :log

      private

      attr_reader :connection
    end # Loader
  end # Importer
end # CartoDB


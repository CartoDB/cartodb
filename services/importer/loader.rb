# encoding: utf-8
require_relative './ogr2ogr'
require_relative '../track_record/track_record'

module CartoDB
  module Importer
    class Loader
      def initialize(connection, log=nil, ogr2ogr=nil)
        @connection = connection
        @log        = log     || TrackRecord::Log.new
        @ogr2ogr    = ogr2ogr || Ogr2ogr.new
      end #initialize

      def run(*args)
        log.append "Using database connection #{connection}"
        ogr2ogr.run
      end #run

      attr_reader :log

      private

      attr_reader :connection, :ogr2ogr
    end # Loader
  end # Importer
end # CartoDB


# encoding: utf-8
require 'forwardable'
require_relative './ogr2ogr'
require_relative '../track_record/track_record'

module CartoDB
  module Importer
    class Loader
      extend Forwardable

      def initialize(job, ogr2ogr=nil)
        self.job      = job
        self.ogr2ogr  = ogr2ogr
      end #initialize

      def run(*args)
        log "Using database connection #{connection}"
        ogr2ogr.run
      end #run

      def ogr2ogr
        @ogr2ogr || Ogr2ogr.new(filepath, id)
      end #ogr2ogr

      private

      attr_accessor :job
      attr_writer   :ogr2ogr

      def_delegators :job, :log, :id, :connection, :filepath
    end # Loader
  end # Importer
end # CartoDB


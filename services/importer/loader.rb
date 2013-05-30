# encoding: utf-8
require 'forwardable'
require_relative './ogr2ogr'

module CartoDB
  module Importer
    class Loader
      extend Forwardable

      def initialize(job, ogr2ogr=nil)
        self.job      = job
        self.ogr2ogr  = ogr2ogr
      end #initialize

      def run(*args)
        log "Using database connection #{pg_options}"
        ogr2ogr.run
        log "ogr2ogr output:    #{ogr2ogr.command_output}"
        log "ogr2ogr exit code: #{ogr2ogr.exit_code}"
      end #run

      def ogr2ogr
        @ogr2ogr || Ogr2ogr.new(filepath, pg_options, id)
      end #ogr2ogr

      private

      attr_accessor :job
      attr_writer   :ogr2ogr

      def_delegators :job, :log, :id, :pg_options, :filepath
    end # Loader
  end # Importer
end # CartoDB


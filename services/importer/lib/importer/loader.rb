# encoding: utf-8
require 'forwardable'
require_relative './ogr2ogr'

module CartoDB
  module Importer
    class Loader
      extend Forwardable

      TABLE_PREFIX = 'importer'

      def initialize(job, source_file, ogr2ogr=nil)
        self.job          = job
        self.source_file  = source_file
        self.ogr2ogr      = ogr2ogr
      end #initialize

      def run
        job.log "Using database connection #{job.pg_options}"
        ogr2ogr.run
        job.log "ogr2ogr output:    #{ogr2ogr.command_output}"
        job.log "ogr2ogr exit code: #{ogr2ogr.exit_code}"
      end #run

      def ogr2ogr
        @ogr2ogr ||= Ogr2ogr.new("importer_#{job.id}", fullpath, pg_options)
      end #ogr2ogr

      private

      attr_writer     :ogr2ogr
      attr_accessor   :job, :source_file

      def_delegators  :job,           :log, :id, :pg_options
      def_delegators  :source_file,   :fullpath, :name, :path
      def_delegators  :ogr2ogr,       :exit_code
    end # Loader
  end # Importer
end # CartoDB


# encoding: utf-8
require_relative './psql'
require_relative './georeferencer'

module CartoDB
  module Importer2
    class SqlLoader
      TABLE_PREFIX = 'importer'

      def self.supported?(extension)
        extension == '.sql'
      end #self.supported?

      def initialize(job, source_file)
        self.job          = job
        self.source_file  = source_file
      end #initialize

      def run
        job.log "Using database connection #{job.concealed_pg_options}"

        psql.run
        job.log "psql output:    #{psql.command_output}"
        job.log "psql exit code: #{psql.exit_code}"

        #raise LoadError if psql.exit_code != 0
        drop_the_geom_webmercator
        @georeferencer.run
        self
      end #run

      def valid_table_names
        [job.table_name]
      end #valid_table_names

      def psql
        @psql ||= Psql.new(job.table_name, source_file.fullpath, job.pg_options)
      end #psql

      def georeferencer
        @georeferencer ||= Georeferencer.new(job.db, job.table_name)
      end #georeferencer

      def drop_the_geom_webmercator
        georeferencer.drop_the_geom_webmercator
      end #drop_the_geom_webmercator
        
      private

      attr_writer     :psql
      attr_accessor   :job, :source_file
    end # SqlLoader
  end # Importer2
end # CartoDB

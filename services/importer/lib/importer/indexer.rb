# encoding: utf-8
require_relative './georeferencer'
require_relative './job'

module CartoDB
  module Importer2
    class Indexer
      DEFAULT_SCHEMA = 'importer'

      def initialize(db, schema=DEFAULT_SCHEMA, job=nil)
        @db     = db
        @schema = schema
        @job    = job || Job.new
      end #initialize

      def add(table_name, index_name=nil)
        return self unless the_geom_in?(table_name)
        job.log "Indexing the_geom in #{table_name}"
        index_name ||= table_name
        db.run(%Q{
          CREATE INDEX "#{index_name}_the_geom_gist"
          ON "#{schema}"."#{table_name}"
          USING GIST (the_geom)
        })
      end #add

      def drop(index_name)
        db.run(%Q{DROP INDEX IF EXISTS "#{schema}"."#{index_name}"})
      end #drop

      private

      attr_reader :db, :schema, :job

      def the_geom_in?(table_name)
        Georeferencer.new(db, table_name, schema)
          .column_exists_in?(table_name, :the_geom)
      end #the_geom_in?
    end # Indexer
  end # Importer2
end # CartoDB


# encoding: utf-8

module CartoDB
  module Importer2
    class Indexer
      DEFAULT_SCHEMA = 'importer'

      def initialize(db, schema=DEFAULT_SCHEMA)
        @db     = db
        @schema = schema
      end #initialize

      def add(table_name, index_name=nil)
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

      attr_reader :db, :schema
    end # Indexer
  end # Importer2
end # CartoDB


# encoding: utf-8

module CartoDB
  class Indexer
    def initialize(db)
      @db = db
    end #initialize

    def add(table_name, index_name=nil)
      db.run(create_index_sql_for(table_name, index_name || table_name))
    end #add

    def drop(index_name)
      db.run(%Q{DROP INDEX IF EXISTS "#{index_name}"})
    end #drop

    private

    attr_reader :db

    def create_index_sql_for(table_name, index_name)
      %Q{
        CREATE INDEX "#{index_name}_the_geom_gist"
        ON "#{table_name}"
        USING GIST (the_geom)
      }
    end #create_index_sql_for
  end # Indexer
end # CartoDB


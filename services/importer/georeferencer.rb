# encoding: utf-8

module CartoDB
  module Importer
    class Georeferencer
      def initialize(db, table_name)
        @db         = db
        @table_name = table_name
      end #initialize

      def run
        create_the_geom_in(table_name)
        georeference(table_name, 'lat', 'lon')
        self
      end #run

      def georeference(table_name, latitude_column_name, longitude_column_name)
        db.run(%Q{
          UPDATE "#{table_name}" 
          SET the_geom = ST_GeomFromText(
              'POINT(' || trim("#{longitude_column_name}") || ' ' ||
                trim("#{latitude_column_name}") || ')', 4326
          )
          WHERE trim(CAST("#{longitude_column_name}" AS text)) ~ 
            '^(([-+]?(([0-9]|[1-9][0-9]|1[0-7][0-9])(\.[0-9]+)?))|[-+]?180)$'
          AND trim(CAST("#{latitude_column_name}" AS text))  ~
            '^(([-+]?(([0-9]|[1-8][0-9])(\.[0-9]+)?))|[-+]?90)$'
        })
      end #georeference

      def create_the_geom_in(table_name)
        db.run(%Q{
          SELECT AddGeometryColumn(
            '#{table_name}','the_geom',4326,'POINT',2
          );
        })
      end #create_the_geom_in

      def column_exists_in?(table_name, column_name)
        columns_in(table_name).include?(column_name.to_sym)
      end #column_exists_in?

      def columns_in(table_name)
        db.schema(table_name, reload: true).map(&:first)
      end #columns_in

      private

      attr_reader :db, :table_name

    end # Georeferencer
  end # Importer
end # CartoDB


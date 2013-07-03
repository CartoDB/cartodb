# encoding: utf-8

module CartoDB
  module Importer2
    class Georeferencer
      LATITUDE_POSSIBLE_NAMES   = %w{ latitude lat latitudedecimal
        latitud lati decimallatitude decimallat }
      LONGITUDE_POSSIBLE_NAMES  = %w{ longitude lon lng 
        longitudedecimal longitud long decimallongitude decimallong }

      def initialize(db, table_name)
        @db         = db
        @table_name = table_name
      end #initialize

      def run
        latitude_column_name  = latitude_column_name_in(table_name)
        longitude_column_name = longitude_column_name_in(table_name)
        return self unless latitude_column_name && longitude_column_name

        create_the_geom_in(table_name)
        populate_the_geom_from_latlon(
          table_name, latitude_column_name, longitude_column_name
        )

        self
      end #run

      def populate_the_geom_from_latlon(table_name, latitude_column_name, 
      longitude_column_name)
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
      end #populate_the_geom_from_latlon

      def create_the_geom_in(table_name)
        return false if column_exists_in?(table_name, 'the_geom')

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

      def latitude_column_name_in(table_name)
        names = LATITUDE_POSSIBLE_NAMES.map { |name| "'#{name}'" }.join(',')
        find_column_in(table_name, names)
      end #latitude_column_name_in

      def longitude_column_name_in(table_name)
        names = LONGITUDE_POSSIBLE_NAMES.map { |name| "'#{name}'" }.join(',')
        find_column_in(table_name, names)
      end #longitude_column_name_in

      def find_column_in(table_name, possible_names)
        sample = db[%Q{
          SELECT column_name 
          FROM information_schema.columns
          WHERE table_name ='#{table_name}'
          AND lower(column_name) in (#{possible_names})
          LIMIT 1
        }].first

        !!sample && sample.fetch(:column_name, false)
      end #find_column_in

      private

      attr_reader :db, :table_name
    end # Georeferencer
  end # Importer2
end # CartoDB


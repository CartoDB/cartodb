# encoding: utf-8
require_relative './column'

module CartoDB
  module Importer2
    class Georeferencer
      LATITUDE_POSSIBLE_NAMES   = %w{ latitude lat latitudedecimal
        latitud lati decimallatitude decimallat }
      LONGITUDE_POSSIBLE_NAMES  = %w{ longitude lon lng 
        longitudedecimal longitud long decimallongitude decimallong }
      GEOMETRY_POSSIBLE_NAMES   = %w{ geometry the_geom wkb_geometry }

      def initialize(db, table_name)
        @db         = db
        @table_name = table_name
        @schema     = 'importer'
      end #initialize

      def run
        create_the_geom_from_geometry_column || create_the_geom_from_latlon 
        self
      end #run

      def create_the_geom_from_latlon
        latitude_column_name  = latitude_column_name_in(qualified_table_name)
        longitude_column_name = longitude_column_name_in(qualified_table_name)

        return false unless latitude_column_name && longitude_column_name

        create_the_geom_in(table_name)
        populate_the_geom_from_latlon(
          qualified_table_name, latitude_column_name, longitude_column_name
        )
      end #create_the_geom_from_latlon

      def create_the_geom_from_geometry_column
        column = Column.new(db, table_name, geometry_column_in(table_name))
        column.geometrify
        unless column_exists_in?(table_name, :the_geom)
          column.rename_to(:the_geom) 
        end
        self
      rescue => exception
        false
      end #create_the_geom_from_geometry_column

      def populate_the_geom_from_latlon(qualified_table_name, 
      latitude_column_name, longitude_column_name)
        db.run(%Q{
          UPDATE #{qualified_table_name} 
          SET the_geom = public.ST_GeomFromText(
              'POINT(' || trim(CAST("#{longitude_column_name}" AS text)) || ' ' ||
                trim(CAST("#{latitude_column_name}" AS text)) || ')', 4326
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
          SELECT public.AddGeometryColumn(
            '#{schema}','#{table_name}','the_geom',4326,'POINT',2
          );
        })
      end #create_the_geom_in

      def column_exists_in?(table_name, column_name)
        columns_in(table_name).include?(column_name.to_sym)
      end #column_exists_in?

      def columns_in(table_name)
        db.schema(table_name, reload: true, schema: 'importer').map(&:first)
      end #columns_in

      def latitude_column_name_in(qualified_table_name)
        names = LATITUDE_POSSIBLE_NAMES.map { |name| "'#{name}'" }.join(',')
        find_column_in(table_name, names)
      end #latitude_column_name_in

      def longitude_column_name_in(qualified_table_name)
        names = LONGITUDE_POSSIBLE_NAMES.map { |name| "'#{name}'" }.join(',')
        find_column_in(table_name, names)
      end #longitude_column_name_in

      def geometry_column_in(qualified_table_name)
        names = GEOMETRY_POSSIBLE_NAMES.map { |name| "'#{name}'" }.join(',')
        find_column_in(table_name, names)
      end #geometry_column_in

      def find_column_in(table_name, possible_names)
        sample = db[%Q{
          SELECT  column_name 
          FROM    information_schema.columns
          WHERE   table_name ='#{table_name}'
          AND     table_schema = '#{schema}'
          AND     lower(column_name) in (#{possible_names})
          LIMIT   1
        }].first

        !!sample && sample.fetch(:column_name, false)
      end #find_column_in

      private

      attr_reader :db, :table_name, :schema

      def qualified_table_name
        "#{schema}.#{table_name}"
      end #qualified_table_name
    end # Georeferencer
  end # Importer2
end # CartoDB


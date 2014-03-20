# encoding: utf-8
require_relative './column'
require_relative './job'

module CartoDB
  module Importer2
    class Georeferencer
      LATITUDE_POSSIBLE_NAMES   = %w{ latitude lat latitudedecimal
        latitud lati decimallatitude decimallat }
      LONGITUDE_POSSIBLE_NAMES  = %w{ longitude lon lng 
        longitudedecimal longitud long decimallongitude decimallong }
      GEOMETRY_POSSIBLE_NAMES   = %w{ geometry the_geom wkb_geometry geom geojson wkt }
      DEFAULT_SCHEMA            = 'cdb_importer'
      THE_GEOM_WEBMERCATOR     = 'the_geom_webmercator'

      def initialize(db, table_name, schema=DEFAULT_SCHEMA, job=nil,
      geometry_columns=nil)
        @db         = db
        @job        = job || Job.new
        @table_name = table_name
        @schema     = schema
        @geometry_columns = geometry_columns || GEOMETRY_POSSIBLE_NAMES
      end #initialize

      def run
        drop_the_geom_webmercator

        create_the_geom_from_geometry_column  || 
        create_the_geom_from_latlon           ||
        create_the_geom_in(table_name)
        raise_if_geometry_collection
        self
      end #run

      def create_the_geom_from_latlon
        latitude_column_name  = latitude_column_name_in(qualified_table_name)
        longitude_column_name = longitude_column_name_in(qualified_table_name)

        return false unless latitude_column_name && longitude_column_name

        job.log 'Creating the_geom from latitude / longitude'
        create_the_geom_in(table_name)
        populate_the_geom_from_latlon(
          qualified_table_name, latitude_column_name, longitude_column_name
        )
      end #create_the_geom_from_latlon

      def create_the_geom_from_geometry_column
        geometry_column_name = geometry_column_in(qualified_table_name)
        return false unless geometry_column_name
        column = Column.new(db, table_name, geometry_column_name, schema, job)
        column.empty_lines_to_nulls
        column.geometrify
        
        unless column_exists_in?(table_name, :the_geom)
          column.rename_to(:the_geom) 
        end

        job.log "Creating the_geom from #{geometry_column_name} column"
        handle_multipoint(qualified_table_name) if multipoint?
        self
      rescue => exception
        job.log "Error creating the_geom: #{exception}"
        if column.empty?
          job.log "Dropping empty #{geometry_column_name}"
          column.drop 
        else
          job.log "Renaming #{geometry_column_name} to invalid_the_geom"
          column.rename_to(:invalid_the_geom)
        end
        false
      end #create_the_geom_from_geometry_column

      # Note: Performs a really simple ',' to '.' normalization.
      # TODO: Candidate for moving to a CDB_xxx function that gets the_geom from lat/long if valid or "convertible"
      def populate_the_geom_from_latlon(qualified_table_name, latitude_column_name, longitude_column_name)
        job.log 'Populating the_geom from latitude / longitude'
        db.run(%Q{
          UPDATE #{qualified_table_name}
          SET the_geom = public.ST_GeomFromText(
              'POINT(' || REPLACE(TRIM(CAST("#{longitude_column_name}" AS text)), ',', '.') || ' ' ||
                REPLACE(TRIM(CAST("#{latitude_column_name}" AS text)), ',', '.') || ')', 4326
          )
          WHERE REPLACE(TRIM(CAST("#{longitude_column_name}" AS text)), ',', '.') ~
            '^(([-+]?(([0-9]|[1-9][0-9]|1[0-7][0-9])(\.[0-9]+)?))|[-+]?180)$'
          AND REPLACE(TRIM(CAST("#{latitude_column_name}" AS text)), ',', '.') ~
            '^(([-+]?(([0-9]|[1-8][0-9])(\.[0-9]+)?))|[-+]?90)$'
        })
      end #populate_the_geom_from_latlon

      def create_the_geom_in(table_name)
        'Creating the_geom column'
        return false if column_exists_in?(table_name, 'the_geom')

        db.run(%Q{
          SELECT public.AddGeometryColumn(
            '#{schema}','#{table_name}','the_geom',4326,'geometry',2
          );
        })
      end #create_the_geom_in

      def column_exists_in?(table_name, column_name)
        columns_in(table_name).include?(column_name.to_sym)
      end #column_exists_in?

      def columns_in(table_name)
        db.schema(table_name, reload: true, schema: schema).map(&:first)
      end #columns_in

      def latitude_column_name_in(qualified_table_name)
        names = LATITUDE_POSSIBLE_NAMES.map { |name| "'#{name}'" }.join(',')
        name  = find_column_in(table_name, names)
        job.log "Identified #{name} as latitude column" if name
        name
      end #latitude_column_name_in

      def longitude_column_name_in(qualified_table_name)
        names = LONGITUDE_POSSIBLE_NAMES.map { |name| "'#{name}'" }.join(',')
        name = find_column_in(table_name, names)
        job.log "Identified #{name} as longitude column" if name
        name
      end #longitude_column_name_in

      def geometry_column_in(qualified_table_name)
        names = geometry_columns.map { |name| "'#{name}'" }.join(',')
        find_column_in(table_name, names)
      end #geometry_column_in

      def drop_the_geom_webmercator
        return self unless column_exists_in?(table_name, THE_GEOM_WEBMERCATOR)

        job.log 'Dropping the_geom_webmercator column'
        column = Column.new(db, table_name, THE_GEOM_WEBMERCATOR, schema, job)
        column.drop
      end #drop_the_geom_webmercator

      def raise_if_geometry_collection
        column = Column.new(db, table_name, :the_geom, schema, job)
        return self unless column.geometry_type == 'GEOMETRYCOLLECTION'
        raise GeometryCollectionNotSupportedError
      end #raise_if_geometry_collection

      def find_column_in(table_name, possible_names)
        sample = db[%Q{
          SELECT  column_name 
          FROM    information_schema.columns
          WHERE   table_name = '#{table_name}'
          AND     table_schema = '#{schema}'
          AND     lower(column_name) in (#{possible_names})
          LIMIT   1
        }].first

        !!sample && sample.fetch(:column_name, false)
      end #find_column_in

      def handle_multipoint(qualified_table_name)
        job.log 'Converting detected multipoint to point'
        db.run(%Q{
          UPDATE #{qualified_table_name} 
          SET the_geom = ST_GeometryN(the_geom, 1)
        })
      end #handle_multipoint

      def multipoint?
        db[%Q{
          SELECT public.GeometryType(the_geom)
          FROM #{qualified_table_name}
          AS geometrytype
        }].first.fetch(:geometrytype) == 'MULTIPOINT'
      rescue
        false
      end #multipoint?

      private

      attr_reader :db, :table_name, :schema, :job, :geometry_columns

      def qualified_table_name
        %Q("#{schema}"."#{table_name}")
      end #qualified_table_name
    end # Georeferencer
  end # Importer2
end # CartoDB


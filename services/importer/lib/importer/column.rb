# encoding: utf-8
module CartoDB
  module Importer
    class Column
      DEFAULT_SRID  = 4326
      WKB_RE        = /^\d{2}/
      GEOJSON_RE    = /coordinates/
      WKT_RE        = /POINT|LINESTRING|POLYGON/
      KML_MULTI_RE  = /<Line|<Polygon/
      KML_POINT_RE  = /<Point>/

      def initialize(db, table_name, column_name)
        @db           = db
        @table_name   = table_name.to_sym
        @column_name  = column_name.to_sym
      end #initialize

      def type
        db.schema(table_name, reload: true).select { |column_details|
          column_details.first == column_name
        }.last.last.fetch(:db_type)
      end #type

      def geometrify
        return self             if empty?
        convert_from_wkt        if wkt?
        convert_from_geojson    if geojson?
        convert_from_kml_multi  if kml_multi?
        convert_from_kml_point  if kml_point?
        cast_to('geometry')
        self
      end #geometrify

      def convert_from_wkt
        db.run(%Q{
          UPDATE #{table_name}
          SET #{column_name} = ST_GeomFromText(#{column_name}, #{DEFAULT_SRID})
        })
        self
      end #convert_from_wkt

      def convert_from_geojson
        db.run(%Q{
          UPDATE #{table_name}
          SET #{column_name} = ST_GeomFromGeoJSON(#{column_name})
        })
        self
      end #convert_from_geojson

      def convert_from_kml_point
        db.run(%Q{
          UPDATE #{table_name}
          SET #{column_name} = ST_GeomFromKML(#{column_name})
        })
      end #convert_from_kml_point

      def convert_from_kml_multi
        db.run(%Q{
          UPDATE #{table_name}
          SET #{column_name} = ST_Multi(ST_GeomFromKML(#{column_name}))
        })
      end #convert_from_kml_multi

      def wkb?
        !!(sample.to_s =~ WKB_RE)
      end #wkb?

      def wkt?
        !!(sample.to_s =~ WKT_RE)
      end #wkt?

      def geojson?
        !!(sample.to_s =~ GEOJSON_RE)
      end #geojson?

      def kml_point?
        !!(sample.to_s =~ KML_POINT_RE)
      end #kml_point?

      def kml_multi?
        !!(sample.to_s =~ KML_MULTI_RE)
      end #kml_multi?

      def cast_to(type)
        db.run(%Q{
          ALTER TABLE #{table_name}
          ALTER #{column_name}
          TYPE #{type}
          USING #{column_name}::#{type}
        })
        self
      end #cast_to

      def sample
        return nil if empty?
        records_with_data.first.fetch(column_name)
      end #sample

      def empty?
        records_with_data.empty?
      end #empty?

      def records_with_data
        @records_with_data ||= db[table_name].with_sql(%Q{
          SELECT * FROM #{table_name}
          WHERE #{column_name} IS NOT NULL 
          AND #{column_name} != ''
        })
      end #records_with_data

      private

      attr_reader :db, :table_name, :column_name
    end # Column
  end # Importer
end # CartoDB


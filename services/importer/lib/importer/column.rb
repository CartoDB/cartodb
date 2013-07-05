# encoding: utf-8
module CartoDB
  module Importer2
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
        @schema       = 'importer'
        @column_name  = column_name.to_sym
      end #initialize

      def type
        db.schema(table_name, reload: true, schema: @schema)
          .select { |column_details|
            column_details.first == column_name
          }.last.last.fetch(:db_type)
      end #type

      def geometrify
        return self             if empty?
        convert_from_wkt        if wkt?
        convert_from_kml_multi  if kml_multi?
        convert_from_kml_point  if kml_point?
        convert_from_geojson    if geojson?
        cast_to('geometry')
        self
      end #geometrify

      def convert_from_wkt
        db.run(%Q{
          UPDATE #{qualified_table_name}
          SET #{column_name} = 
            public.ST_GeomFromText(#{column_name}, #{DEFAULT_SRID})
        })
        self
      end #convert_from_wkt

      def convert_from_geojson
        db.run(%Q{
          UPDATE #{qualified_table_name}
          SET #{column_name} = public.ST_GeomFromGeoJSON(#{column_name})
        })
        self
      end #convert_from_geojson

      def convert_from_kml_point
        db.run(%Q{
          UPDATE #{qualified_table_name}
          SET #{column_name} = public.ST_GeomFromKML(#{column_name})
        })
      end #convert_from_kml_point

      def convert_from_kml_multi
        db.run(%Q{
          UPDATE #{qualified_table_name}
          SET #{column_name} = 
            public.ST_Multi(public.ST_GeomFromKML(#{column_name}))
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
          ALTER TABLE #{qualified_table_name}
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
        @records_with_data ||= db[%Q{
          SELECT * FROM "#{schema}"."#{table_name}"
          WHERE #{column_name} IS NOT NULL 
          AND #{column_name} != ''
        }]
      end #records_with_data

      def rename_to(new_name)
        db.run(%Q{
          ALTER TABLE "#{schema}"."#{table_name}"
          RENAME COLUMN #{column_name} TO #{new_name}
        })
        @column_name = new_name
      end #rename_to

      private

      attr_reader :db, :table_name, :column_name, :schema

      def qualified_table_name
        "#{schema}.#{table_name}"
      end #qualified_table_name
    end # Column
  end # Importer2
end # CartoDB


# encoding: utf-8
module CartoDB
  module Importer
    class GeometryProcessor
      DEFAULT_SRID = 4326

      def initialize(db, table_name)
        @db         = db
        @table_name = table_name.to_sym
      end #initialize

      def parse(column_name)
        convert_from_wkt(column_name) unless is_wkb?(column_name)
        cast_to_geometry(column_name) if is_wkb?(column_name)
      end #parse

      def convert_from_wkt(column_name)
        db.run(%Q{
          UPDATE #{table_name}
          SET #{column_name} = ST_GeomFromText(#{column_name}, #{DEFAULT_SRID})
        })
      end #convert_from_wkt

      def is_wkb?(column_name)
        !!(sample_geometry_from(column_name).to_s =~ /^\d{2}/)
      end #is_wkb?

      def cast_to_geometry(column_name)
        db.run(%Q{
          ALTER TABLE #{table_name}
          ALTER #{column_name}
          TYPE geometry
          USING #{column_name}::geometry
        })
      end #cast_to_geometry

      def sample_geometry_from(column_name)
        db[table_name.to_sym].with_sql(%Q{
          SELECT * FROM #{table_name}
          WHERE #{column_name} IS NOT NULL
        }).to_a.first.fetch(column_name.to_sym)
      end #sample_geometry_from

      private

      attr_reader :db, :table_name
    end # GeometryProcessor
  end # Importer
end # CartoDB


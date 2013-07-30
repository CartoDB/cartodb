# encoding: utf-8
require_relative './column'

module CartoDB
  module Importer2
    class Reprojector
      DEFAULT_SRID = 4326

      def initialize(db)
        @db     = db
        @schema =  'importer'
      end #initialize

      def reproject(table_name, column_name)
        renamed_column_name = "#{column_name}_orig"
        qualified_table_name = qualified_table_name_for(table_name)

        column = Column.new(db, table_name, column_name)
        column.rename_to(renamed_column_name)

        add_geometry_column(table_name, column_name, column.geometry_type)
        transform(qualified_table_name, renamed_column_name, column_name)

        column.drop
      end 

      def add_geometry_column(table_name, column_name, type='POINT')
        db.run(%Q{
          SELECT public.AddGeometryColumn(
            'importer', '#{table_name}','#{column_name}',#{DEFAULT_SRID},'#{type}',2
          )
        })
      end #add_geometry_column

      def transform(table_name, origin_column, destination_column)
        db.run(%Q{
          UPDATE #{table_name}
          SET #{destination_column} = public.ST_Force_2D(
            public.ST_Transform(#{origin_column}, #{DEFAULT_SRID})
          ) 
          WHERE #{origin_column} IS NOT NULL
        })
      end #transform

      private

      attr_reader :db, :schema

      def qualified_table_name_for(table_name)
        "#{schema}.#{table_name}"
      end #qualified_table_name
    end # Importer2
  end # Reprojector
end # CartoDB


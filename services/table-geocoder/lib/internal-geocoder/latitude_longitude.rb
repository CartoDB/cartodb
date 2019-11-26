require_relative '../../../importer/lib/importer/query_batcher'

module CartoDB
  module InternalGeocoder

    class LatitudeLongitude

      def initialize(db, logger = nil)
        @db = db
        @logger = logger
      end

      def geocode(table_schema, table_name, latitude_column, longitude_column)
        qualified_table_name = "\"#{table_schema}\".\"#{table_name}\""
        query_fragment_update = %Q{
          UPDATE #{qualified_table_name}
          SET
            the_geom = ST_GeomFromText(
              'POINT(' || REPLACE(TRIM(CAST("#{longitude_column}" AS text)), ',', '.') || ' ' ||
                REPLACE(TRIM(CAST("#{latitude_column}" AS text)), ',', '.') || ')', 4326
            )
        }
        query_fragment_where = %Q{
          REPLACE(TRIM(CAST("#{longitude_column}" AS text)), ',', '.') ~
            '^(([-+]?(([0-9]|[1-9][0-9]|1[0-7][0-9])(\.[0-9]+)?))|[-+]?180)$'
          AND REPLACE(TRIM(CAST("#{latitude_column}" AS text)), ',', '.')  ~
            '^(([-+]?(([0-9]|[1-8][0-9])(\.[0-9]+)?))|[-+]?90)$'
        }

        CartoDB::Importer2::QueryBatcher.new(
            @db, 
            @logger, 
            !table_has_cartodb_id(table_schema, table_name)
          ).execute_update(
              %Q{#{query_fragment_update} where #{query_fragment_where}},
              table_schema, table_name
          )
      end

      def table_has_cartodb_id(table_schema, table_name)
        result = @db.fetch(%Q{
          select *
          from information_schema.columns
          where table_schema = '#{table_schema}' 
            and table_name = '#{table_name}' 
            and column_name = 'cartodb_id'
            and data_type = 'integer';
        }).all
        !result[0].nil?
      end

    end

  end
end

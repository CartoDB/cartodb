require 'open3'
require_relative './shp_helper'

module CartoDB
  module Importer2
    class ArcGISAutoguessing

      def initialize(db, schema_name, table_name, fields_metadata)
        @db              = db
        @schema_name     = schema_name
        @table_name      = table_name
        @fields_metadata = fields_metadata
      end

      def run
        autoguess_dates
      end

      def autoguess_dates
        date_fields = @fields_metadata.select { |field| field['type'] == 'esriFieldTypeDate' }
        date_fields.each do |field|
          @db.run(%{
            ALTER TABLE #{@schema_name}.#{@table_name} ALTER COLUMN #{field['name'].downcase} TYPE DATE
            using to_timestamp(cast(#{field['name'].downcase}::bigint/1000 as bigint))::date
          })
        end
      end

    end
  end
end

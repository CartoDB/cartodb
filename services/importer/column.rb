# encoding: utf-8
module CartoDB
  module Importer
    class Column
      DEFAULT_SRID    = 4326
      WKB_REGEX       = /^\d{2}/

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
        return self         if empty?
        convert_from_wkt    unless wkb?
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

      def wkb?
        !!(sample.to_s =~ WKB_REGEX)
      end #wkb?

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
        db[table_name].with_sql(%Q{
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


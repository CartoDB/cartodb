# encoding: utf-8
require_relative './job'

module CartoDB
  module Importer2
    class Typecaster
      DATE_POSSIBLE_NAMES = %w{ created_at updated_at }
      DEFAULT_SCHEMA      = 'cdb_importer'

      def initialize(db, table_name, schema=DEFAULT_SCHEMA, job=nil,
      date_columns=[])
        @db           = db
        @job          = job || Job.new
        @table_name   = table_name
        @schema       = schema
        @date_columns = date_columns.map(&:to_sym)
      end #initialize

      def run
        (date_columns + candidate_columns).uniq
          .select { |column_name| castable?(column_name) }
          .each { |column_name| cast(column_name) }
      end

      def candidate_columns
        db.schema(table_name, reload: true, schema: schema)
          .map(&:first)
          .select { |column_name|
            column_name =~ /_at/  || 
            column_name =~ /date/ ||
            column_name =~ /time/
          }
      end

      def cast(column_name) 
        job.log "Casting #{column_name} to timestamp with time zone"
        db.run(%Q(
          ALTER TABLE "#{schema}"."#{table_name}"
          ALTER COLUMN #{column_name}
          TYPE timestamptz
          USING public.CDB_StringToDate(#{column_name})
        ))
      end

      def castable?(column_name)
        !db[table_name.to_sym].with_sql(%Q(
          SELECT public.CDB_StringToDate(#{column_name})
          FROM "#{schema}"."#{table_name}"
          AS convertible
        )).empty?
      rescue => exception
        false
      end

      private

      attr_reader :db, :job, :table_name, :schema, :date_columns
    end # Typecaster
  end # Importer2
end # CartoDB


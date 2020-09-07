require_relative './job'

module CartoDB
  module Importer2
    class Typecaster

      DEFAULT_SCHEMA      = 'cdb_importer'

      def initialize(db, table_name, schema=DEFAULT_SCHEMA, job=nil, date_columns=[])
        @db           = db
        @job          = job || Job.new
        @table_name   = table_name
        @schema       = schema
        @date_columns = date_columns.map(&:to_sym)
      end

      def run
        (date_columns + candidate_columns).uniq
          .select { |column_name|
            castable?(column_name)
          }
          .each { |column_name|
            cast(column_name)
          }
      end

      def candidate_columns
        return []
        # For now, only specific columns sent
        db.schema(table_name, reload: true, schema: schema)
          .map(&:first)
          .select { |column_name|
            column_name =~ /_at/  ||
            column_name =~ /date/ ||
            column_name =~ /time/
          }
      end

      def cast(column_name)
        cast_to_timestamptz(column_name) if castable_to_date?(column_name)
      end

      def castable?(column_name)
        castable_to_date?(column_name)
      end

      private

      def castable_to_date?(column_name)
        # TODO: CDB_StringToDate() is faulty as by default casts discarding hour/min/secs, but for checks is enough
        !db[table_name.to_sym].with_sql(%Q(
          SELECT CDB_StringToDate(#{column_name})
          FROM "#{schema}"."#{table_name}"
          AS convertible
        )).empty?
      rescue StandardError
        false
      end

      def cast_to_timestamptz(column_name)
        job.log "Casting '#{column_name}' to timestamp with time zone"

        # TODO: Use CDB_StringToDate() instead whenever generalizing typecasting
        db.run(%Q(
          ALTER TABLE "#{schema}"."#{table_name}"
          ALTER COLUMN #{column_name} TYPE timestamptz
          USING #{column_name}::timestamp
        ))
      end

      attr_reader :db, :job, :table_name, :schema, :date_columns

    end
  end
end

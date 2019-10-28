require_relative './column'
require_relative './job'
require_relative './query_batcher'
require_relative '../../../table-geocoder/lib/internal-geocoder/latitude_longitude'

module CartoDB
  module Importer2
    class GeometryFixer
      DEFAULT_BATCH_SIZE = 1000
      DEFAULT_SCHEMA = 'cdb_importer'.freeze

      def initialize(db, table_name, schema = DEFAULT_SCHEMA, geometry_column = nil, job = nil)
        @db = db
        @table_name = table_name
        @schema = schema
        @geometry_column = geometry_column
        @job = job || Job.new
      end

      def run
        disable_autovacuum

        make_geometries_valid

        enable_autovacuum
        self
      end

      def disable_autovacuum
        job.log "Disabling autovacuum for #{qualified_table_name}"
        db.run(%{
         ALTER TABLE #{qualified_table_name} SET (autovacuum_enabled = FALSE, toast.autovacuum_enabled = FALSE);
        })
      end

      def enable_autovacuum
        job.log "Enabling autovacuum for #{qualified_table_name}"
        db.run(%{
         ALTER TABLE #{qualified_table_name} SET (autovacuum_enabled = TRUE, toast.autovacuum_enabled = TRUE);
        })
      end

      private

      attr_reader :db, :table_name, :schema, :job, :geometry_column

      def qualified_table_name
        %("#{schema}"."#{table_name}")
      end

      def make_geometries_valid
        job.log 'Fixing geometries'
        QueryBatcher.new(db, job, true, DEFAULT_BATCH_SIZE).execute_update(
          %{
            UPDATE #{qualified_table_name}
            SET the_geom = public.ST_MakeValid("#{@geometry_column}")
            WHERE ST_IsValid("#{@geometry_column}") = FALSE
          },
          schema, table_name
        )
      end

    end
  end
end


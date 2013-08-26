# encoding: utf-8
require_relative './raster2pgsql'

module CartoDB
  module Importer2
    class TiffLoader
      def self.supported?(extension)
        extension =~ /tif/
      end #self.supported?

      def initialize(job, source_file, raster2pgsql=nil)
        self.job            = job
        self.source_file    = source_file
        self.raster2pgsql   = raster2pgsql
      end #initialize

      def run
        job.log "Using database connection with #{job.concealed_pg_options}"

        raster2pgsql.run
        job.log "raster2pgsql output:    #{raster2pgsql.command_output}"
        job.log "raster2pgsql exit code: #{raster2pgsql.exit_code}"

        job.db.run(%Q{
          ALTER TABLE #{job.qualified_table_name}
          RENAME COLUMN rid TO cartodb_id
        })
        job.db.run(%Q{
          SELECT public.AddGeometryColumn(
            '#{job.schema}','#{job.table_name}','the_geom',4326,'POLYGON',2
          );
        })

        self
      end #run

      def raster2pgsql
        @raster2pgsql ||= Raster2Pgsql.new(
          job.qualified_table_name, source_file.fullpath, job.pg_options
        )
      end #raster2pgsql

      def valid_table_names
        [job.table_name]
      end #valid_table_names

      private

      attr_writer     :raster2pgsql
      attr_accessor   :job, :source_file
    end # TiffLoader
  end # Importer2
end # CartoDB


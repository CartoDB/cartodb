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
        self.options        = {}
      end #initialize

      def run(post_import_handler_instance=nil)
        @post_import_handler = post_import_handler_instance

        job.log "Using database connection with #{job.concealed_pg_options}"

        raster2pgsql.run
        job.log "raster2pgsql output:    #{raster2pgsql.command_output}"
        job.log "raster2pgsql exit code: #{raster2pgsql.exit_code}"

        job.db.run(%Q{
          ALTER TABLE #{job.qualified_table_name}
          RENAME COLUMN rid TO cartodb_id
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

      attr_accessor   :options

      private

      attr_writer     :raster2pgsql
      attr_accessor   :job, :source_file
    end # TiffLoader
  end # Importer2
end # CartoDB


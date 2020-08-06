require_relative './raster2pgsql'

module CartoDB
  module Importer2
    class TiffLoader
      def self.supported?(extension)
        extension =~ /tif/
      end

      def initialize(job, source_file, raster2pgsql=nil)
        self.job            = job
        self.source_file    = source_file
        self.raster2pgsql   = raster2pgsql
        self.options        = {}
      end

      def run(post_import_handler_instance=nil)
        @post_import_handler = post_import_handler_instance

        job.log "Using database connection with #{job.concealed_pg_options}"

        raster2pgsql.run
        job.log "raster2pgsql output:    #{raster2pgsql.command_output}"
        job.log "raster2pgsql exit code: #{raster2pgsql.exit_code}"

        if raster2pgsql.exit_code != 0
          if raster2pgsql.command_output =~ /no space left on device/i
            raise FileTooBigError.new(job.logger)
          end
          raise LoadError.new(job.logger)
        end

        job.db.run(%Q{
          ALTER TABLE #{job.qualified_table_name}
          RENAME COLUMN rid TO cartodb_id
        })

        self
      rescue StandardError => exception
        begin
          clean_temporary_tables
        ensure
          raise exception
        end
      end

      def clean_temporary_tables
        additional_support_tables.each { |table_name|
          job.delete_temp_table(table_name)
        }
        job.delete_job_table
      end

      # CONVENTION: support_tables will always end in "_tablename"
      def additional_support_tables
        raster2pgsql.additional_support_tables
      end

      def raster2pgsql
        @raster2pgsql ||= Raster2Pgsql.new(job.table_name, source_file.fullpath, job.pg_options, job.db)
      end

      def valid_table_names
        [job.table_name]
      end

      attr_accessor   :options

      private

      attr_writer     :raster2pgsql
      attr_accessor   :job, :source_file
    end
  end
end

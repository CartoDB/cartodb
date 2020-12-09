require 'pg'
require 'sequel'

module CartoDB
  module Importer2
    class Job

      DEFAULT_IMPORT_SCHEMA = 'cdb_importer'

      def initialize(attributes={})
        @id         = attributes.fetch(:id, Carto::UUIDHelper.random_uuid)
        @logger     = attributes.fetch(:logger, nil)
        @logger     = new_logger if @logger.nil?
        @pg_options = attributes.fetch(:pg_options, {})
        @schema     = attributes.fetch(:schema, DEFAULT_IMPORT_SCHEMA)

        @table_names = []
        new_table_name
      end

      def new_table_name
        new_name = "importer_#{id.gsub(/-/, '')}"
        if @table_names.length > 0
          new_name = "#{new_name}_#{@table_names.length}"
        end
        @table_names << new_name
      end

      def new_logger
        Carto::Log.new_data_import
      end

      def log(message, truncate = true)
        @logger.append(message, truncate)
      end

      def table_name
        @table_names.last
      end

      def db
        @db ||= Sequel.postgres(pg_options.merge(:after_connect=>(proc do |conn|
          conn.execute('SET search_path TO "$user", cartodb, public')
        end)))
      end

      def qualified_table_name
        %Q("#{schema}"."#{table_name}")
      end

      def concealed_pg_options
        pg_options.reject { |key, value| key.to_s == 'password' }
      end

      def import_error_percent
        if !imported_rows.nil? && !(source_file_rows.to_i == 0)
          return ((imported_rows - source_file_rows).abs.to_f/source_file_rows)*100
        else
          return nil
        end
      end

      def delete_job_table
        delete_temp_table(table_name)
      end

      def delete_temp_table(table_name)
        db.run(%{DROP TABLE IF EXISTS #{@schema}.#{table_name}})
      end

      attr_reader :id, :logger, :pg_options, :schema
      attr_accessor :success_status, :source_file_rows, :imported_rows, :fallback_executed

    end
  end
end

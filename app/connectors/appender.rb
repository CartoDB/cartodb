# encoding: utf-8

module CartoDB
  module Connector
    class Appender
      DESTINATION_SCHEMA    = 'public'
      DROP_NAMES            = %W{ cartodb_id created_at updated_at ogc_fid }

      attr_accessor :table

      def initialize(runner, table_registrar, quota_checker, database,
      data_import_id, table_id)
        @runner           = runner
        @table_registrar  = table_registrar
        @quota_checker    = quota_checker
        @database         = database
        @data_import_id   = data_import_id
        @existing_table   = ::Table.where(id: table_id).first
      end

      def run(tracker)
        runner.run(&tracker)

        if quota_checker.over_storage_quota?
          drop(results)
        else
          @result = results.select(&:success?).first
          append(@result)
        end

        self
      rescue => exception
        drop(results)
        raise CartoDB::AppendError
      end

      def append(result)
        existing_table_name     = existing_table.name
        new_table_name          = result.table_name
        
        @new_table_schema       = schema_for(new_table_name, result.schema)
        @existing_table_schema  = schema_for(existing_table_name)

        sanitized_columns       = sanitized_columns_from(new_table_schema)
        unmatching_columns      = unmatching_columns_from(sanitized_columns)
        matching_columns        = matching_columns_from(sanitized_columns)
        different_type_columns  = different_type_columns_from(matching_columns) 

        different_type_columns.each { |column_name, metadata|
          column_type = cartodb_type_for(metadata.fetch(:db_type))
          cast(new_table_name, column_name, column_type)
        }

        unmatching_columns.each { |column_name, metadata|
          column_type = cartodb_type_for(metadata.fetch(:db_type))
          existing_table.add_column!(name: column_name, type: column_type)
        }

        insert(existing_table_name, new_table_name, sanitized_columns.keys)

        cartodbfy(existing_table_name)
        existing_table.send :invalidate_varnish_cache
        update_cdb_tablemetadata(existing_table.name)
        drop([result])
        self
      rescue => exception
        puts exception.to_s + exception.backtrace.join("\n")
      end

      def cartodbfy(table_name)
        database.run(%Q(SELECT CDB_CartodbfyTable('#{oid_from(table_name)}')))
      rescue => exception
        stacktrace = exception.to_s + exception.backtrace.join("\n")
        Rollbar.report_message("Sync cartodbfy error", "error", error_info: stacktrace)
        raise
      end

      def update_cdb_tablemetadata(name)
        user.in_database(as: :superuser)[:cdb_tablemetadata]
          .where(tabname: name)
          .update(updated_at: Time.now)
      rescue => exception
      end

      def cast(table_name, column_name, type)
        CartoDB::ColumnTypecaster.new(
          user_database:  database,
          schema:         'cdb_importer',
          table_name:     table_name,
          column_name:    column_name,
          new_type:       type
        ).run
      end

      def sanitized_columns_from(table_schema)
        table_schema.reject { |column_name, metadata|
          reserved_or_existing?(column_name)
        }
      end

      def matching_columns_from(columns={})
        columns.select { |column_name, metadata| matching?(column_name) }
      end

      def unmatching_columns_from(columns={})
        columns.reject { |column_name, metadata| matching?(column_name) }
      end

      def different_type_columns_from(columns={})
        columns.reject { |column_name, metadata| matching_type?(column_name) }
      end

      def matching_type?(column_name)
        existing_table_schema.fetch(column_name) ==
          new_table_schema.fetch(column_name)
      end
      
      def reserved_or_existing?(column_name)
        ::Table::RESERVED_COLUMN_NAMES.include?(column_name.to_s) ||
        DROP_NAMES.include?(column_name.to_s)
      end

      def matching?(column_name)
        existing_table_schema.keys.include?(column_name)
      end

      def insert(existing_table_name, new_table_name, columns)
        database.execute(%Q{
          INSERT INTO "public"."#{existing_table_name}" (#{columns.join(',')})
          ( 
            SELECT #{columns.join(',')}
            FROM "cdb_importer"."#{new_table_name}"
          )
        })
      end

      def drop(results)
        results.each do |result|
          puts "Drop ===== #{result.qualified_table_name}"
          database.execute(%Q(
            DROP TABLE #{result.qualified_table_name}
          ))
        end
      rescue => exception
        puts exception.to_s + exception.backtrace.join("\n")
      end

      def success?
        !quota_checker.over_storage_quota? && runner.success?
      end

      def results
        runner.results
      end

      def error_code
        return 8001 if quota_checker.over_storage_quota?
        results.map(&:error_code).compact.first
      end #errors_from

      def cartodb_type_for(database_type)
        CartoDB::TYPES.keys.find { |key|
          CartoDB::TYPES.fetch(key).include?(database_type)
        }
      end

      def user
        existing_table.owner
      end

      def oid_from(table_name)
        database[%Q(
          SELECT 'public.#{table_name}'::regclass::oid
          AS oid
        )].first.fetch(:oid)
      end

      private

      attr_reader :runner, :table_registrar, :quota_checker, :database,
      :data_import_id, :existing_table, :existing_table_schema,
      :new_table_schema

      def schema_for(table_name, schema_name=DESTINATION_SCHEMA)
        Hash[
          database.schema(table_name, schema: schema_name, reload: true)
        ]
      end
    end # Appender
  end # Connector
end # CartoDB


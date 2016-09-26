# encoding: utf-8

require_relative './base'

# Base class for Connector Providers
# that use FDW to import data through a foreign table
module Carto
  class Connector
    class FdwProvider < Provider
      def copy_table(schema_name:, table_name:, limits: {})
        log "Connector Copy table  #{schema_name}.#{table_name}"
        validate!
        # TODO: logging with CartoDB::Logger
        with_server do
          begin
            qualified_table_name = fdw_qualified_table_name(schema_name, table_name)
            foreign_table_name = foreign_table_name(foreign_prefix)
            log "Creating Foreign Table"
            execute_as_superuser _create_foreign_table_command
            log "Copying Foreign Table"
            max_rows = limits[:max_rows]
            execute _copy_foreign_table_command(
              qualified_table_name, qualified_foreign_table_name(foreign_table_name), max_rows
            )
            check_copied_table_size(qualified_table_name, max_rows)
          ensure
            execute_as_superuser _drop_foreign_table_command(foreign_table_name) if foreign_table_name
          end
        end
      end

      def list_tables(limits: {})
        limit = limits[:max_listed_tables]
        validate! only: [:connection]
        with_server do
          # TODO: let the providers decide what needs to be executed as superuser
          # (we use superuser here because the provider may need to create auxiliar foreing tables)
          execute_as_superuser _list_tables_command(limit)
        end
      end

      def remote_data_updated?
        # TODO: can we detect if query results have changed?
        true
      end

      private

      include FdwSupport

      # Execute code that requires a FDW server/user mapping
      # The server name is given by the method `#server_name`
      def with_server
        # Currently we create temporary server and user mapings when we need them,
        # and drop them after use.
        log "Creating Server"
        execute_as_superuser _create_server_command
        log "Creating Usermap"
        execute_as_superuser _create_usermap_command
        yield
      rescue => error
        log "Connector Error #{error}"
        raise error
      ensure
        log "Connector cleanup"
        execute_as_superuser _drop_usermap_command
        execute_as_superuser _drop_server_command
        log "Connector cleaned-up"
      end

      # maximum unique identifier length in PostgreSQL
      MAX_PG_IDENTIFIER_LEN = 63
      # minimum length left available for the table part in foreign table names
      MIN_TAB_ID_LEN        = 10

      # Named used for the foreign server (unique poer Connector instance)
      def server_name
        max_len = MAX_PG_IDENTIFIER_LEN - unique_suffix.size - MIN_TAB_ID_LEN - 1
        connector_name = Carto::DB::Sanitize.sanitize_identifier self.class.to_s.split('::').last
        "#{connector_name[0...max_len].downcase}_#{unique_suffix}"
      end

      # Prefix to be used by foreign table names (so they're unique per Connector instance)
      # This leaves at least MIN_TAB_ID_LEN available identifier characters given PostgreSQL's
      # limit of MAX_PG_IDENTIFIER_LEN
      def foreign_prefix
        "#{server_name}_"
      end

      def foreign_table_schema
        # since connectors' foreign table names are unique (because
        # server names are unique and not reused)
        # we could in principle use any schema (@schema, 'public', 'cdb_importer')
        CartoDB::Connector::Importer::ORIGIN_SCHEMA
      end

      def qualified_foreign_table_name(foreign_table_name)
        %{"#{foreign_table_schema}"."#{foreign_table_name}"}
      end

      def _create_server_command
        create_server_command server_name
      end

      def _create_usermap_command
        [
          create_usermap_command(server_name, @connector_context.user.database_username),
          create_usermap_command(server_name, 'postgres')
        ].join("\n")
      end

      def _create_foreign_table_command
        create_foreign_table_command server_name, foreign_table_schema,
                                               foreign_prefix,
                                               @connector_context.user.database_username
      end

      def _drop_server_command
        drop_server_command server_name
      end

      def _drop_usermap_command
        [
          drop_usermap_command(server_name, 'postgres'),
          drop_usermap_command(server_name, @connector_context.user.database_username)
        ].join("\n")
      end

      def _drop_foreign_table_command(foreign_table_name)
        drop_foreign_table_command foreign_table_schema, foreign_table_name
      end

      def _copy_foreign_table_command(local_table_name, foreign_table_name, max_rows)
        limit = (max_rows && max_rows > 0) ? " LIMIT #{max_rows}" : ''
        %{
          CREATE TABLE #{local_table_name}
            AS SELECT * FROM #{foreign_table_name}
              #{limit};
        }
      end

      def _list_tables_command(limit)
        list_tables_command(server_name, foreign_table_schema, foreign_prefix, limit)
      end

      # SQL code to create the FDW server
      def create_server_command(_server_name)
        must_be_defined_in_derived_class
      end

      # SQL code to create the usermap for the user and postgres roles
      def create_usermap_command(_server_name, _username)
        must_be_defined_in_derived_class
      end

      # SQL code to create the foreign table used for importing
      def create_foreign_table_command(_server_name, _schema_name, _foreign_prefix, _username)
        must_be_defined_in_derived_class
      end

      # SQL code to drop the FDW server
      def drop_server_command(server_name)
        fdw_drop_server server_name, cascade: true
      end

      # SQL code to drop the user mapping
      def drop_usermap_command(server_name, user)
        fdw_drop_usermap server_name, user
      end

      # SQL code to drop the foreign table
      def drop_foreign_table_command(schema_name, table_name)
        fdw_drop_foreign_table schema_name, table_name
      end

      def check_copied_table_size(table_name, max_rows)
        warnings = {}
        if max_rows && max_rows > 0
          num_rows = execute(%{
            SELECT count(*) as num_rows FROM #{table_name};
          }).first['num_rows']
          if num_rows == max_rows
            # The maximum number of rows per connection was reached
            warnings[:max_rows_per_connection] = max_rows
          end
        end
        warnings
      end

      def unique_suffix
        @unique_suffix ||= UUIDTools::UUID.timestamp_create.to_s.delete('-') # .to_i.to_s(16) # or hash from user, etc.
      end
    end
  end
end

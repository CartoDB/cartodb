# encoding: utf-8

module CartoDB
  module Synchronization
    class Adapter
      DESTINATION_SCHEMA = 'public'
      STATEMENT_TIMEOUT = 1.hour * 1000
      THE_GEOM = 'the_geom'.freeze

      attr_accessor :table

      def initialize(table_name, runner, database, user)
        @table_name   = table_name
        @runner       = runner
        @database     = database
        @user         = user
        @failed       = false
      end

      def run(&tracker)
        runner.run(&tracker)
        result = runner.results.select(&:success?).first

        if runner.remote_data_updated?
          if result.nil?
            data_for_exception = "Expecting success data for table '#{table_name}'\nResults:#{runner.results.to_s}\n"
            data_for_exception << "1st result:#{runner.results.first.inspect}"
            raise data_for_exception
          end
          copy_privileges(user.database_schema, table_name, result.schema, result.table_name)
          index_statements = generate_index_statements(user.database_schema, table_name)
          move_to_schema(result)
          geo_type = cartodbfy(result.table_name)
          overwrite(table_name, result)
          setup_table(table_name, geo_type)
          run_index_statements(index_statements)
        end
        self
      rescue => exception
        @failed = true
        puts '=================='
        puts exception.to_s
        puts exception.backtrace
        puts '=================='
        raise exception
      end

      def overwrite(table_name, result)
        return false unless runner.remote_data_updated?
        temporary_name = temporary_name_for(result.table_name)

        # The relation might (and probably will) already exist in the user public schema
        # as source table is a synchronization and those keep same ID along their life
        # (and the geom index uses table id as base for its name),
        # so first we need to remove old table, then change schema of the imported one
        # and finally rename newly moved table to original name
        database.transaction do
          rename(table_name, temporary_name) if exists?(table_name)
          drop(temporary_name) if exists?(temporary_name)
          rename(result.table_name, table_name)
        end
        update_cdb_tablemetadata(table_name)
        fix_oid(table_name)
      rescue => exception
        puts "Sync overwrite ERROR: #{exception.message}: #{exception.backtrace.join}"

        # Gets all attributes in the result except for 'log_trace', as it is too long for Rollbar
        result_hash = CartoDB::Importer2::Result::ATTRIBUTES.map { |m| [m, result.send(m)] if m != 'log_trace' }
                                                            .compact.to_h
        CartoDB::Logger.error(message: 'Error in sync cartodbfy',
                              exception: exception,
                              user: user,
                              table: table_name,
                              result: result_hash)
        drop(result.table_name) if exists?(result.table_name)
        raise exception
      end

      def fix_oid(table_name)
        user_table = user.tables.where(name: table_name).first

        user_table.sync_table_id
        user_table.save
      end

      def cartodbfy(table_name)
        schema_name = user.database_schema
        qualified_table_name = "\"#{schema_name}\".#{table_name}"

        type = fix_the_geom_type!(schema_name, table_name)
        import_cleanup(schema_name, table_name)

        user.transaction_with_timeout(statement_timeout: STATEMENT_TIMEOUT) do |user_conn|
          user_conn.run(%Q{
            SELECT cartodb.CDB_CartodbfyTable('#{schema_name}'::TEXT,'#{qualified_table_name}'::REGCLASS);
          })
        end

        update_table_pg_stats(qualified_table_name)
        return type
      rescue => exception
        CartoDB::Logger.error(message: 'Error in sync cartodbfy',
                              exception: exception,
                              user: user,
                              table: table_name)
        raise exception
      end

      def update_table_pg_stats(qualified_table_name)
        user.transaction_with_timeout(statement_timeout: STATEMENT_TIMEOUT) do |user_conn|
          user_conn.run(%Q{
            ANALYZE #{qualified_table_name};
          })
        end
      end

      def setup_table(table_name, geo_type)
        table = user.tables.where(name: table_name).first.service

        table.force_schema = true

        table.import_to_cartodb(table_name)
        table.schema(reload: true)
        table.reload

        # We send the detected geometry type to avoid manipulating geoms twice
        # set_the_geom_column! should just edit the metadata with the specified type
        table.send :set_the_geom_column!, geo_type
        table.save
      rescue => exception
        CartoDB::Logger.error(message: 'Error in setup cartodbfy',
                              exception: exception,
                              user: user,
                              table: table_name)
      ensure
        fix_oid(table_name)
      end

      # From Table#get_the_geom_type!, adapted to unregistered tables
      # returns type to run Table#get_the_geom_type! afterwards again, which
      # saves the type in table metadata
      def fix_the_geom_type!(schema_name, table_name)
        qualified_table_name = "\"#{schema_name}\".#{table_name}"

        type = nil
        the_geom_data = user.in_database[%Q{
          SELECT a.attname, t.typname
          FROM pg_attribute a, pg_type t
          WHERE attrelid = '#{qualified_table_name}'::regclass
          AND attname = '#{THE_GEOM}'
          AND a.atttypid = t.oid
          LIMIT 1
        }].first
        return nil unless the_geom_data

        if the_geom_data[:typname] != 'geometry'
          user.in_database.rename_column(qualified_table_name, THE_GEOM, :the_geom_str)
          return nil
        end

        geom_type = user.in_database[%Q{
          SELECT GeometryType(#{THE_GEOM})
          FROM #{qualified_table_name}
          WHERE #{THE_GEOM} IS NOT null
          LIMIT 1
        }].first

        type = geom_type[:geometrytype].to_s.downcase if geom_type

        # if the geometry is MULTIPOINT we convert it to POINT
        if type == 'multipoint'
          user.db_service.in_database_direct_connection(statement_timeout: STATEMENT_TIMEOUT) do |user_database|
            user_database.run("SELECT public.AddGeometryColumn('#{schema_name}', '#{table_name}','the_geom_simple',4326, 'GEOMETRY', 2);")
            user_database.run(%Q{UPDATE #{qualified_table_name} SET the_geom_simple = ST_GeometryN(the_geom,1);})
            user_database.run("SELECT DropGeometryColumn('#{schema_name}', '#{table_name}','the_geom');")
            user_database.run(%Q{ALTER TABLE #{qualified_table_name} RENAME COLUMN the_geom_simple TO the_geom;})
          end
          type = 'point'
        end

        # if the geometry is LINESTRING or POLYGON we convert it to MULTILINESTRING or MULTIPOLYGON
        if %w(linestring polygon).include?(type)
          user.db_service.in_database_direct_connection(statement_timeout: STATEMENT_TIMEOUT) do |user_database|
            user_database.run("SELECT public.AddGeometryColumn('#{schema_name}', '#{table_name}','the_geom_simple',4326, 'GEOMETRY', 2);")
            user_database.run(%Q{UPDATE #{qualified_table_name} SET the_geom_simple = ST_Multi(the_geom);})
            user_database.run("SELECT DropGeometryColumn('#{schema_name}', '#{table_name}','the_geom');")
            user_database.run(%Q{ALTER TABLE #{qualified_table_name} RENAME COLUMN the_geom_simple TO the_geom;})

            type = user_database[%Q{
              SELECT GeometryType(#{THE_GEOM})
              FROM #{qualified_table_name}
              WHERE #{THE_GEOM} IS NOT null
              LIMIT 1
            }].first[:geometrytype]
          end
        end

        type
      end

      # From Table#import_cleanup, with column schema checks adapted to unregistered tables
      def import_cleanup(schema_name, table_name)
        qualified_table_name = "\"#{schema_name}\".#{table_name}"

        user.in_database_direct_connection(statement_timeout: STATEMENT_TIMEOUT) do |user_database|
          # When tables are created using ogr2ogr they are added a ogc_fid or gid primary key
          # In that case:
          #  - If cartodb_id already exists, remove ogc_fid
          #  - If cartodb_id does not exist, treat this field as the auxiliary column
          aux_cartodb_id_column = user_database[%Q{
            SELECT a.attname, t.typname
            FROM pg_attribute a, pg_type t
            WHERE attrelid = '#{qualified_table_name}'::regclass
            AND a.attname = 'ogc_fid' OR a.attname = 'gid'
            AND a.atttypid = t.oid
            LIMIT 1
          }].first
          aux_cartodb_id_column = aux_cartodb_id_column[:attname] unless aux_cartodb_id_column.nil?

          # Remove primary key
          existing_pk = user_database[%Q{
            SELECT c.conname AS pk_name
            FROM pg_class r, pg_constraint c, pg_namespace n
            WHERE r.oid = c.conrelid AND contype='p' AND relname = '#{table_name}'
            AND r.relnamespace = n.oid and n.nspname= '#{schema_name}'
          }].first
          existing_pk = existing_pk[:pk_name] unless existing_pk.nil?
          user_database.run(%Q{
            ALTER TABLE #{qualified_table_name} DROP CONSTRAINT "#{existing_pk}"
          }) unless existing_pk.nil?

          # All normal fields casted to text
          varchar_columns = user_database[%Q{
            SELECT a.attname, t.typname
            FROM pg_attribute a, pg_type t
            WHERE attrelid = '#{qualified_table_name}'::regclass
            AND typname = 'varchar'
            AND a.atttypid = t.oid
          }].all

          varchar_columns.each do |column|
            user_database.run(%Q{ALTER TABLE #{qualified_table_name} ALTER COLUMN "#{column[:attname]}" TYPE text})
          end

          # If there's an auxiliary column, copy to cartodb_id and restart the sequence to the max(cartodb_id)+1
          if aux_cartodb_id_column.present?
            begin
              already_had_cartodb_id = false
              user_database.run(%Q{ALTER TABLE #{qualified_table_name} ADD COLUMN cartodb_id SERIAL})
            rescue
              already_had_cartodb_id = true
            end
            unless already_had_cartodb_id
              user_database.run(%Q{UPDATE #{qualified_table_name} SET cartodb_id = CAST(#{aux_cartodb_id_column} AS INTEGER)})
              cartodb_id_sequence_name = user_database["SELECT pg_get_serial_sequence('#{schema_name}.#{table_name}', 'cartodb_id')"].first[:pg_get_serial_sequence]
              max_cartodb_id = user_database[%Q{SELECT max(cartodb_id) FROM #{qualified_table_name}}].first[:max]
              # only reset the sequence on real imports.

              if max_cartodb_id
                user_database.run("ALTER SEQUENCE #{cartodb_id_sequence_name} RESTART WITH #{max_cartodb_id + 1}")
              end
            end
            user_database.run(%Q{ALTER TABLE #{qualified_table_name} DROP COLUMN #{aux_cartodb_id_column}})
          end

        end
      end

      def update_cdb_tablemetadata(name)
        user.tables.where(name: name).first.update_cdb_tablemetadata
      end

      def success?
        (!@failed  && runner.success?)
      end

      def etag
        runner.etag
      end

      def last_modified
        runner.last_modified
      end

      def checksum
        runner.checksum
      end

      def move_to_schema(result, schema=DESTINATION_SCHEMA)
        # The new table to sync is moved to user schema to allow CartoDBfication.
        # This temporal table should not be registered (check ghost_tables_manager.rb)
        return self if schema == result.schema
        database.execute(%Q{
          ALTER TABLE "#{result.schema}"."#{result.table_name}"
          SET SCHEMA "#{user.database_schema}"
        })
      end

      def rename(current_name, new_name)
        database.execute(%Q{
          ALTER TABLE "#{user.database_schema}"."#{current_name}"
          RENAME TO #{new_name}
        })
      end

      def drop(table_name)
        database.execute(%Q(DROP TABLE "#{user.database_schema}"."#{table_name}"))
      rescue
        self
      end

      def exists?(table_name)
        database.table_exists?(table_name)
      end

      def results
        runner.results
      end

      def error_code
        runner.results.map(&:error_code).compact.first
      end

      def runner_log_trace
        runner.results.map(&:log_trace).compact.first
      end

      def error_message
        ''
      end

      def temporary_name_for(table_name)
        "#{table_name}_to_be_deleted"
      end

      def copy_privileges(origin_schema, origin_table_name, destination_schema, destination_table_name)
        user.in_database(as: :superuser).execute(%Q(
          UPDATE pg_class
          SET relacl=(
            SELECT r.relacl FROM pg_class r, pg_namespace n
            WHERE r.relname='#{origin_table_name}'
            and r.relnamespace = n.oid
            and n.nspname = '#{origin_schema}'
          )
          WHERE relname='#{destination_table_name}'
          and relnamespace = (select oid from pg_namespace where nspname = '#{destination_schema}')
        ))
      rescue => exception
        Rollbar.report_message('Error copying privileges', 'error',
                               { error: exception.inspect,
                                 origin_schema: origin_schema,
                                 origin_table_name: origin_table_name,
                                 destination_schema: destination_schema,
                                 destination_table_name: destination_table_name } )
      end

      # Store all indexes to re-create them after "syncing" the table by reimporting and swapping it
      # INFO: As upon import geom index names are not enforced, they might "not collide" and generate one on the new import
      # plus the one already existing, so we skip those
      def generate_index_statements(origin_schema, origin_table_name)
        # INFO: This code discerns gist indexes like lib/sql/CDB_CartodbfyTable.sql -> _CDB_create_the_geom_columns
        user.in_database(as: :superuser)[%Q(
          SELECT indexdef AS indexdef
          FROM pg_indexes
          WHERE schemaname = '#{origin_schema}'
          AND tablename = '#{origin_table_name}'
          AND indexname NOT IN (
            SELECT ir.relname
              FROM pg_am am, pg_class ir,
                pg_class c, pg_index i,
                pg_attribute a
              WHERE c.oid  = '#{origin_schema}.#{origin_table_name}'::regclass::oid AND i.indrelid = c.oid
                AND i.indexrelid = ir.oid
                AND i.indnatts = 1
                AND i.indkey[0] = a.attnum
                AND a.attrelid = c.oid
                AND NOT a.attisdropped
                AND am.oid = ir.relam
                AND (
                  (
                    (a.attname = '#{::Table::THE_GEOM}' OR a.attname = '#{::Table::THE_GEOM_WEBMERCATOR}')
                    AND am.amname = 'gist'
                  ) OR (
                    a.attname = '#{::Table::CARTODB_ID}'
                    AND ir.relname <> '#{origin_table_name}_pkey'
                  )
                )
            )
        )].map { |record| record.fetch(:indexdef) }
      end

      def run_index_statements(statements)
        statements.each { |statement|
          begin
            database.run(statement)
          rescue => exception
            if exception.message !~ /relation .* already exists/
              Rollbar.report_message('Error copying indexes', 'error',
                                   { error: exception.inspect,
                                     statement: statement } )
            end
          end
        }
      end

      private

      attr_reader :table_name, :runner, :database, :user
    end
  end
end

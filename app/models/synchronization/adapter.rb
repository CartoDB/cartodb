require 'carto/importer/table_setup'

module CartoDB
  module Synchronization
    class Adapter

      include ::LoggerHelper

      STATEMENT_TIMEOUT = (1.hour * 1000).freeze
      DESTINATION_SCHEMA = 'public'.freeze
      THE_GEOM = 'the_geom'.freeze
      OVERWRITE_ERROR = 2013

      def initialize(table_name, runner, database, user, overviews_creator, synchronization_id, logger = nil)
        @table_name   = table_name
        @runner       = runner
        @database     = database
        @user         = user
        @overviews_creator = overviews_creator
        @failed       = false
        @table_setup = ::Carto::Importer::TableSetup.new(
          user: user,
          overviews_creator: overviews_creator,
          log: runner.log
        )
        @error_code = nil
        @synchronization_id = synchronization_id
        @logger = logger
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

          Carto::GhostTablesManager.run_synchronized(
            user.id, attempts: 10, timeout: 3000,
            message: "Couldn't acquire bolt to register. Registering sync without bolt",
            user: user,
            synchronization_id: @synchronization_id
          ) do
            move_to_schema(result)
            geo_type = fix_the_geom_type!(user.database_schema, result.table_name)
            import_cleanup(user.database_schema, result.table_name)
            @table_setup.cartodbfy(result.table_name)
            overwrite(user.database_schema, table_name, result, geo_type)
            setup_table(table_name, geo_type)
          end
        end
        self
      rescue StandardError => exception
        @failed = true
        puts '=================='
        puts exception.to_s
        puts exception.backtrace
        puts '=================='
        drop(result.table_name) if result && exists?(result.table_name)
        raise exception
      end

      def user
        @user
      end

      def overwrite(schema, table_name, result, geo_type)
        # Determine what kind of overwrite to perform
        # overwrite_replace substitutes the existing table by the new one,
        # so any modifications since previous import/sync are lost.
        # overwrite_sync will preserve columns added since the import/sync,
        # and the geometry as well if the new table doesn't have it (nil geo_type)

        # For the time being the latter method will only be used with tables
        # that have had the geocoder analysis applied, resulting in an column
        # named carto_geocode_hash being present.
        # TODO: we could perform the sync if there's any column named `_carto_*`
        # (carto_geocode_hash would need be renamed as _carto_geocode_hash)
        sync = has_column(schema, table_name, 'carto_geocode_hash')

        if sync
          overwrite_sync(schema, table_name, result, geo_type)
        else
          overwrite_replace(schema, table_name, result)
        end
      end

      def overwrite_sync(schema, table_name, result, geo_type)
        return false unless runner.remote_data_updated?

        # NOTE the import table is already moved to the user schema;
        # this was done (#7543) because the cartodbfication performs
        # queries on CDB_UserQuotaSize and other functions expected
        # to exist in the schema of the table.
        qualified_result_table_name = %{"#{schema}"."#{result.table_name}"}
        skip_columns = '{the_geom, the_geom_webmercator}'

        database.transaction do
          if geo_type.nil?
            # If there's no geometry in the result table, not worth
            # syncing. Maybe those were added via geocoding
            database.execute(%{
              SELECT cartodb.CDB_SyncTable(
                '#{qualified_result_table_name}',
                '#{schema}', '#{table_name}',
                '#{skip_columns}'
              )})
          else
            database.execute(%{
              SELECT cartodb.CDB_SyncTable(
                '#{qualified_result_table_name}',
                '#{schema}', '#{table_name}'
              )})
          end
        end

        drop(result.table_name) if exists?(result.table_name)

        # TODO not sure whether these two are needed
        @table_setup.fix_oid(table_name)
        @table_setup.update_cdb_tablemetadata(table_name)
      rescue StandardError => exception
        @error_code = OVERWRITE_ERROR
        puts "Sync overwrite ERROR: #{exception.message}: #{exception.backtrace.join}"

        # Gets all attributes in the result except for 'log_trace', as it is too long for Rollbar
        result_hash = CartoDB::Importer2::Result::ATTRIBUTES.map { |m| [m, result.send(m)] if m != 'log_trace' }
                                                            .compact.to_h
        log_error(message: 'Error in sync overwrite', exception: exception, result: result_hash)
        drop(result.table_name) if exists?(result.table_name)
        raise exception
      end

      def overwrite_replace(schema, table_name, result)
        return false unless runner.remote_data_updated?

        table_statements = @table_setup.generate_table_statements(schema, table_name)

        temporary_name = temporary_name_for(result.table_name)
        swap_tables(table_name, temporary_name, result)
        @table_setup.fix_oid(table_name)
        @table_setup.update_cdb_tablemetadata(table_name)
        @table_setup.run_table_statements(table_statements, @database)
      rescue StandardError => exception
        @error_code = OVERWRITE_ERROR
        puts "Sync overwrite ERROR: #{exception.message}: #{exception.backtrace.join}"

        # Gets all attributes in the result except for 'log_trace', as it is too long for Rollbar
        result_hash = CartoDB::Importer2::Result::ATTRIBUTES.map { |m| [m, result.send(m)] if m != 'log_trace' }
                                                            .compact.to_h
        log_error(message: 'Error in sync overwrite', exception: exception, result: result_hash)
        drop(result.table_name) if exists?(result.table_name)
        raise exception
      end

      def setup_table(table_name, geo_type)
        table = Carto::UserTable.find(user.tables.where(name: table_name).first.id).service

        table.force_schema = true

        table.import_to_cartodb(table_name)
        table.schema(reload: true)
        table.reload

        # We send the detected geometry type to avoid manipulating geoms twice
        # set_the_geom_column! should just edit the metadata with the specified type
        table.send :set_the_geom_column!, geo_type
        table.save
      rescue StandardError => e
        log_error(message: 'Error in setup cartodbfy', exception: e)
      ensure
        @table_setup.fix_oid(table_name)
      end

      def has_column(schema_name, table_name, column_name)
        qualified_table_name = "\"#{schema_name}\".#{table_name}"
        sql = %{
          SELECT TRUE as has_column FROM pg_catalog.pg_attribute a
          WHERE
            a.attname = '#{column_name}'
            AND a.attnum > 0
            AND NOT a.attisdropped
            AND a.attrelid = '#{qualified_table_name}'::regclass::oid
            LIMIT 1
        }
        result = user.in_database[sql].first
        result && result[:has_column]
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
          AND a.attstattarget < 0
          LIMIT 1
        }].first
        return nil unless the_geom_data

        if the_geom_data[:typname] != 'geometry'
          user.in_database.execute %{
              ALTER TABLE #{qualified_table_name} RENAME COLUMN "#{THE_GEOM}" TO "the_geom_str"
          }
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
            user_database.run("UPDATE #{qualified_table_name} SET the_geom = ST_GeometryN(the_geom,1);")
          end
          type = 'point'
        end

        # if the geometry is LINESTRING or POLYGON we convert it to MULTILINESTRING or MULTIPOLYGON
        if %w(linestring polygon).include?(type)
          user.db_service.in_database_direct_connection(statement_timeout: STATEMENT_TIMEOUT) do |user_database|
            user_database.run("UPDATE #{qualified_table_name} SET the_geom = ST_Multi(the_geom);")

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

        user.db_service.in_database_direct_connection(statement_timeout: STATEMENT_TIMEOUT) do |user_database|

          # For consistency with regular imports, also eases testing
          # The sanitization of @table_name is applied to the newly imported table_name
          # This should not be necessary, since setup_table, called after cartodbfication
          # also perfomes column sanitization via Table#import_to_cartodb
          # but is kept because there may be existing syncs for which this double sanitization
          # (version 1 sanitization which wasn't idemponent) had the effect of altering some
          # satinizated names (e.g. __1 -> _1).
          table = Carto::UserTable.find(@user.tables.where(name: @table_name).first.id).service
          table.sanitize_columns(table_name: table_name, database_schema: schema_name, connection: user_database)

          # When tables are created using ogr2ogr they are added a ogc_fid or gid primary key
          # In that case:
          #  - If cartodb_id already exists, remove ogc_fid
          #  - If cartodb_id does not exist, treat this field as the auxiliary column
          aux_cartodb_id_column = [:ogc_fid, :gid].find do |col|
            valid_cartodb_id_candidate?(user, table_name, qualified_table_name, col)
          end

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
            rescue StandardError
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
        # This temporary table should not be registered (check ghost_tables_manager.rb)
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
      end

      def exists?(table_name)
        database.table_exists?(table_name)
      end

      def results
        runner.results
      end

      def error_code
        @error_code || runner.results.map(&:error_code).compact.first
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

      private

      def swap_tables(table_name, temporary_name, result)
        database.transaction do
          rename(table_name, temporary_name) if exists?(table_name)
          drop(temporary_name) if exists?(temporary_name)
          rename(result.table_name, table_name)
        end
      rescue Exception => exception
        if exception.message.include?('canceling statement due to statement timeout')
          # Check if the table has any lock and cancel locking queries
          locks = user.in_database(as: :superuser).fetch(%Q{
            SELECT pid, query 
            FROM pg_stat_activity 
            WHERE pid in (
              SELECT pid FROM pg_locks l 
              JOIN pg_class t ON l.relation = t.oid 
              AND t.relkind = 'r' 
              WHERE t.relname IN ('#{table_name}')
            );
          }).all
          @logger.append_and_store "Transaction timed out as the table is blocked by other queries. Terminating locking queries and retrying in 60 seconds..." if @logger && locks.present?
          locks.each do |lock|
              @logger.append_and_store "Terminating query: #{lock[:query]}" if @logger
              user.in_database(as: :superuser).execute %Q{
              SELECT pg_terminate_backend(#{lock[:pid]});
            }
          end
          sleep(60) # wait 60 seconds and retry the swap
          database.transaction do
            rename(table_name, temporary_name) if exists?(table_name)
            drop(temporary_name) if exists?(temporary_name)
            rename(result.table_name, table_name)
          end
        else
          raise exception
        end
      end

      def valid_cartodb_id_candidate?(user, table_name, qualified_table_name, col_name)
        return false unless column_names(user, table_name).include?(col_name)
        user.transaction_with_timeout(statement_timeout: STATEMENT_TIMEOUT, as: :superuser) do |db|
          return db["SELECT 1 FROM #{qualified_table_name} WHERE #{col_name} IS NULL LIMIT 1"].first.nil?
        end
      end

      def column_names(user, table_name)
        user.in_database.schema(table_name, schema: user.database_schema).map { |row| row[0] }
      rescue StandardError => e
        log_error(message: 'Error in column_names from sync adapter', exception: e)
        []
      end

      attr_reader :table_name, :runner, :database, :user

      def log_context
        super.merge(table: { name: table_name }, current_user: user)
      end
    end
  end
end

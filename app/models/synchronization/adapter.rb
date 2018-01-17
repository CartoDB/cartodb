# encoding: utf-8

require 'carto/importer/table_setup'

module CartoDB
  module Synchronization
    class Adapter
      STATEMENT_TIMEOUT = (1.hour * 1000).freeze
      DESTINATION_SCHEMA = 'public'.freeze
      THE_GEOM = 'the_geom'.freeze
      OVERWRITE_ERROR = 2013

      attr_accessor :table

      def initialize(table_name, runner, database, user, overviews_creator)
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
          index_statements = @table_setup.generate_index_statements(user.database_schema, table_name)
          move_to_schema(result)
          geo_type = fix_the_geom_type!(user.database_schema, result.table_name)
          import_cleanup(user.database_schema, result.table_name)
          @table_setup.cartodbfy(result.table_name)
          @table_setup.copy_privileges(user.database_schema, table_name, user.database_schema, result.table_name)
          overwrite(table_name, result)
          setup_table(table_name, geo_type)
          @table_setup.run_index_statements(index_statements, @database)
          @table_setup.recreate_overviews(table_name)
        end
        self
      rescue => exception
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
        @table_setup.fix_oid(table_name)
        @table_setup.update_cdb_tablemetadata(table_name)
      rescue => exception
        @error_code = OVERWRITE_ERROR
        puts "Sync overwrite ERROR: #{exception.message}: #{exception.backtrace.join}"

        # Gets all attributes in the result except for 'log_trace', as it is too long for Rollbar
        result_hash = CartoDB::Importer2::Result::ATTRIBUTES.map { |m| [m, result.send(m)] if m != 'log_trace' }
                                                            .compact.to_h
        CartoDB::Logger.error(message: 'Error in sync overwrite',
                              exception: exception,
                              user: user,
                              table: table_name,
                              result: result_hash)
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
      rescue => exception
        CartoDB::Logger.error(message: 'Error in setup cartodbfy',
                              exception: exception,
                              user: user,
                              table: table_name)
      ensure
        @table_setup.fix_oid(table_name)
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

        user.db_service.in_database_direct_connection(statement_timeout: STATEMENT_TIMEOUT) do |user_database|
          # When tables are created using ogr2ogr they are added a ogc_fid or gid primary key
          # In that case:
          #  - If cartodb_id already exists, remove ogc_fid
          #  - If cartodb_id does not exist, treat this field as the auxiliary column
          aux_cartodb_id_column = user_database[%Q{
            SELECT a.attname, t.typname
            FROM pg_attribute a, pg_type t
            WHERE attrelid = '#{qualified_table_name}'::regclass
            AND (a.attname = 'ogc_fid' OR a.attname = 'gid')
            AND a.atttypid = t.oid
            AND a.attstattarget < 0
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

      attr_reader :table_name, :runner, :database, :user
    end
  end
end

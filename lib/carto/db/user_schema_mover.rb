# encoding: utf-8

module Carto
  module Db
    class UserSchemaMover
      # Approach: move object by object (tables, views, materialized and functions)
      STEPS_STRATEGY = :move_schema_content_step_by_step
      # Alternative approach: rename the schema and handle the exceptions.
      # Currently experimental, prone to side effects and not as generic as expected.
      RENAMING_STRATEGY = :move_schema_content_by_renaming

      STRATEGIES = [STEPS_STRATEGY, RENAMING_STRATEGY].freeze

      def initialize(user)
        @user = user
      end

      def default_strategy
        STEPS_STRATEGY
      end

      def move_objects(new_schema, strategy = default_strategy)
        raise "Not valid: #{strategy}" unless STRATEGIES.include?(strategy)

        old_schema = @user.database_schema

        @user.database_schema = new_schema
        @user.this.update database_schema: new_schema

        send(strategy, old_schema, new_schema)
      end

      private

      # Moves the schema by moving tables, views...
      def move_schema_content_step_by_step(old_schema, new_schema)
        @user.in_database(as: :superuser) do |conn|
          database = Database.new(@user.database_name, conn)
          database.create_schema(new_schema)
          @user.db_service.rebuild_quota_trigger_with_database(conn)

          conn.transaction do
            @user.real_tables(old_schema).
              each { |t| move_table_to_schema(t, conn, old_schema, new_schema) }

            views(conn, old_schema).
              each { |v| move_view_to_schema(v, conn, old_schema, new_schema) }

            materialized_views(conn, old_schema).
              each { |v| move_materialized_view_to_schema(v, conn, old_schema, new_schema) }

            functions(conn, old_schema).
              each { |f| move_function_to_schema(f, conn, old_schema, new_schema) }
          end
        end
      end

      def move_table_to_schema(table, database, old_schema, new_schema)
        old_name = "#{old_schema}.#{table[:relname]}"

        was_cartodbfied = cdb_drop_triggers(table, database, old_schema)

        database.run(%{ ALTER TABLE #{old_name} SET SCHEMA "#{new_schema}" })

        cdb_cartodbfy(table, database, new_schema) if was_cartodbfied
      end

      def cdb_drop_triggers(table, database, schema)
        name = "#{schema}.#{table[:relname]}"

        cartodbfied = Carto::UserTable.find_by_user_id_and_name(@user.id, table[:relname]).present?

        database.run(%{ SELECT cartodb._CDB_drop_triggers('#{name}'::REGCLASS) }) if cartodbfied

        cartodbfied
      end

      def cdb_cartodbfy(table, database, schema)
        name = "#{schema}.#{table[:relname]}"

        database.run(%{ SELECT cartodb.CDB_CartodbfyTable('#{schema}'::TEXT, '#{name}'::REGCLASS) })
      end

      def move_view_to_schema(view, database, old_schema, new_schema)
        old_name = "#{old_schema}.#{view.name}"

        database.run(%{ ALTER VIEW #{old_name} SET SCHEMA "#{new_schema}" })
      end

      def move_materialized_view_to_schema(view, database, old_schema, new_schema)
        old_name = "#{old_schema}.#{view.name}"

        database.run(%{ ALTER MATERIALIZED VIEW #{old_name} SET SCHEMA "#{new_schema}" })
      end

      def move_function_to_schema(function, database, old_schema, new_schema)
        old_name = "#{old_schema}.#{function.name}"

        database.run(%{ ALTER FUNCTION #{old_name}(#{function.argument_data_types}) SET SCHEMA "#{new_schema}" })
      end

      def views(db, schema = @user.database_schema, owner_role = @user.database_username)
        Carto::Db::Database.new(@user.database_name, db).views(schema, owner_role, 'v')
      end

      def materialized_views(db, schema = @user.database_schema, owner_role = @user.database_username)
        Carto::Db::Database.new(@user.database_name, db).views(schema, owner_role, 'm')
      end

      def functions(db, schema = @user.database_schema, owner_role = @user.database_username)
        Carto::Db::Database.new(@user.database_name, db).functions(schema, owner_role)
      end

      # Moves the schema by renaming + moving some things back
      # EXPERIMENTAL. See #6295 and #6467.
      # move_schema_content_step_by_step is preferred right now.
      def move_schema_content_by_renaming(old_name, new_name)
        @user.in_database(as: :superuser) do |database|
          database.transaction do
            cartodbfied_tables = {}
            @user.real_tables(old_name).each do |t|
              cartodbfied_tables[t] = cdb_drop_triggers(t, database, old_name)
            end

            rename_schema_with_database(database, old_name, new_name)

            Database.new(@database_name, database).create_schema(old_name)
            move_postgis_to_schema(database, old_name)
            move_plproxy_to_schema(database, old_name, new_name)
            move_odbc_fdw_to_schema(database, old_name)
            @user.db_service.rebuild_quota_trigger_with_database(database)

            cartodbfied_tables.select { |_, is_cartodbfied| is_cartodbfied }.map do |t, _|
              cdb_cartodbfy(t, database, new_name)
            end
          end
        end
      end

      def rename_schema_with_database(database, old_name, new_name)
        database.run(%{ALTER SCHEMA "#{old_name}" RENAME TO "#{new_name}"})
      end

      def move_postgis_to_schema(database, schema)
        database.run(%{ALTER EXTENSION postgis SET SCHEMA "#{schema}"})
      end

      def move_odbc_fdw_to_schema(database, schema)
        odbc_fdw_installed = database.fetch(%{
          SELECT count(*) FROM pg_extension WHERE extname='odbc_fdw'
        }).first[:count] > 0
        if odbc_fdw_installed
          database.run %{ALTER EXTENSION odbc_fdw SET SCHEMA "#{schema}"}
        end
      end

      def move_plproxy_to_schema(database, old_schema, new_schema)
        # extension "plproxy" does not support SET SCHEMA
        functions(database, @user.database_username, old_schema).
          select { |f| /^plproxy/.match(f.name) }.
          each { |f| move_function_to_schema(f, database, old_schema, new_schema) }
      end

    end
  end
end

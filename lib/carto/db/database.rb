# encoding: utf-8

require_dependency 'carto/db/view'
require_dependency 'carto/db/function'
require_dependency 'carto/db/trigger'

module Carto
  module Db
    class Database

      def self.build_with_user(user)
        Database.new(user.database_name, user.in_database)
      end

      def initialize(database_name, conn)
        @database_name = database_name
        @conn = conn
      end

      # Attempts to create a new database schema
      # Does not raise exception if the schema already exists
      def create_schema(schema, role = nil)
        if role
          @conn.run(%{CREATE SCHEMA "#{schema}" AUTHORIZATION "#{role}"})
        else
          @conn.run(%{CREATE SCHEMA "#{schema}"})
        end
      rescue Sequel::DatabaseError => e
        raise unless e.message =~ /schema .* already exists/
      end

      def triggers(schema)
        query = %{
          select table_catalog, table_schema, relname, tgname, tgtype, proname, tgdeferrable, tginitdeferred, tgnargs,
          tgattr, tgargs from (pg_trigger join pg_class on tgrelid=pg_class.oid)
          join pg_proc on (tgfoid=pg_proc.oid) join information_schema.tables ist on relname = table_name
          where table_schema = '#{schema}'
          and table_catalog = '#{@database_name}'
        }

        @conn[query].all.map do |t|
          Trigger.new(
            database_name: t[:table_catalog],
            database_schema: t[:table_schema],
            table_name: t[:table_name],
            trigger_name: t[:tgname])
        end
      end

      def materialized_views(schema, owner_role)
        views(schema, owner_role, 'm')
      end

      # relkind: 'm' (materialized view) or 'v' (view). Default: 'v'.
      def views(schema, owner_role, relkind = 'v')
        query = %{
          select ns.nspname as schemaname,
                 pc.relname as matviewname,
                 string_agg(atr.attname ||' '||pg_catalog.format_type(atr.atttypid, NULL), ', ') as columns
          from pg_class pc
            join pg_namespace ns on pc.relnamespace = ns.oid
            join pg_attribute atr
              on atr.attrelid = pc.oid
             and atr.attnum > 0
             and not atr.attisdropped
            join pg_roles
              on pc.relowner = pg_roles.oid
          where pc.relkind = '#{relkind}'
             and ns.nspname = '#{schema}'
             and rolname = '#{owner_role}'
          group by ns.nspname, pc.relname;
        }
        @conn[query].all.map do |t|
          View.new(
            database_name: @database_name,
            database_schema: t[:schemaname],
            name: t[:matviewname],
            relkind: relkind)
        end
      end

      def functions(schema, owner_role)
        query = %{
          SELECT n.nspname,
            p.proname,
            pg_catalog.pg_get_function_identity_arguments(p.oid) as argument_data_types
          FROM pg_catalog.pg_proc p
               LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
               JOIN pg_roles
                 on p.proowner = pg_roles.oid
          WHERE pg_catalog.pg_function_is_visible(p.oid)
                AND n.nspname = '#{schema}'
                AND rolname = '#{owner_role}'
        }
        @conn[query].all.map do |t|
          Function.new(
            database_name: @database_name,
            database_schema: [:nspname],
            name: t[:proname],
            argument_data_types: t[:argument_data_types])
        end
      end

    end
  end
end

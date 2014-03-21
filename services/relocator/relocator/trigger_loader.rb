require_relative 'utils'
module CartoDB
  module Relocator
    class TriggerLoader
      include CartoDB::Relocator::Connections
      def initialize(params={})    
        @config = params[:config]
        @dbname = @config[:dbname]
      end
      def load_table_trigger(conn=source_db, tablename=nil)
        unless tablename
          #we are going to loop over all tables
          get_all_tables(conn).each do |table|
            load_table_trigger(conn, table)
          end
        else
          puts "Loading trigger on table #{tablename}.."
          conn.query(create_table_trigger_command(tablename) )
        end
      end

      def load_triggers(conn=source_db, redis=@config[:redis], queue=@dbname)
        puts "Creating trigger functions.."
        conn.query(create_trigger_funcs_command(redis, queue))
        load_table_trigger(conn)
        conn.query(create_ddl_trigger_command)
      end

      def unload_triggers(conn=source_db)
        puts "Unloading DDL triggers.."
        conn.query(drop_ddl_trigger_command)
        get_all_tables.each do |tablename|
          puts "Unloading trigger on table #{tablename}.."
          conn.query(drop_table_trigger_command(tablename))
        end
        puts "Dropping functions.."
        conn.query("DROP FUNCTION queue_event_ddl_py(text) CASCADE;")
        conn.query("DROP FUNCTION queue_event() CASCADE;")
        conn.query("DROP FUNCTION queue_event_ddl() CASCADE;")

      end

      def get_all_tables(conn=source_db)
        conn.query("select table_name from information_schema.tables where table_schema='public'
               and table_name NOT IN ('spatial_ref_sys','cdb_tablemetadata')").to_a
        .collect{|t| t['table_name']}
      end


      def drop_table_trigger_command(tablename)
        "DROP TRIGGER IF EXISTS write_migration_log on public.#{tablename};"
      end

      def create_table_trigger_command(tablename)
        drop_table_trigger_command(tablename) +
          "CREATE TRIGGER write_migration_log AFTER UPDATE or INSERT or DELETE on public.#{tablename} FOR EACH STATEMENT EXECUTE PROCEDURE queue_event();"
      end

      def create_ddl_trigger_command
        drop_ddl_trigger_command +
          "CREATE EVENT TRIGGER write_migration_log_ddl ON ddl_command_start EXECUTE PROCEDURE queue_event_ddl();"
      end

      def drop_ddl_trigger_command
        "DROP EVENT TRIGGER IF EXISTS write_migration_log_ddl;"
      end

      def create_trigger_funcs_command(redis, queue="queue")
        erb = ERB.new(File.read(File.join(File.dirname(File.expand_path(__FILE__)), 'trigger_functions.sql.erb')))
        erb.result binding
      end

    end
  end
end


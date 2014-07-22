require_relative 'utils'

module CartoDB
  module Relocator
    class SchemaDumper
      include CartoDB::Relocator::Connections
      def initialize(params={})    
        @config = params[:config]
        #@source_db = params[:source_db] || PG.connect(@config[:source][:conn])
        #@target_db = params[:source_db] || PG.connect(@config[:target][:conn])
        @dbname = @config[:dbname]
        @username = @config[:username]
      end

      def dump_command(config, schema)
        "pg_dump -n '#{schema}' --verbose --no-tablespaces -Z 0 #{Utils.conn_string(config)}"
      end

      def restore_command(config)
        #"pg_restore --verbose --single-transaction --no-tablespaces --disable-triggers #{Utils.conn_string(config)}"
        "psql -v on_error_stop=1 #{Utils.conn_string(config)}"
      end


      def superuser_conn
        superuser_conf = @config[:target][:conn].clone
        superuser_conf.merge!(:user => 'postgres', :dbname => 'postgres')
        @superuser_conn ||= PG.connect(superuser_conf)
      end

      def create_db(dbname)
        #connect as superuser (postgres)
        puts "Creating DB #{dbname}..."
        begin
          superuser_conn.query("CREATE DATABASE \"#{dbname}\"")
        rescue PG::Error => e
          puts "Error- Database already exists?"
          throw e
        end
      end

      def get_tables(conn=@config[:source])
        @table_conn ||= PG.connect(conn[:conn])
        query = "SELECT table_name FROM information_schema.tables WHERE table_schema='#{conn[:schema]}' AND table_type='BASE TABLE';"
        @table_conn.query(query).to_a.collect{|t| t['table_name']}
      end

      def remove_target_schema(conn=@config[:target])
        @drop_conn ||= PG.connect(conn[:conn])
        @drop_conn.query("DROP SCHEMA #{conn[:schema]} CASCADE;")
      end

      def migrate
        command = "(echo \"BEGIN TRANSACTION;\"; #{dump_command(@config[:source][:conn], @config[:target][:schema])}; echo \"COMMIT;\")| sed \"s/^CREATE SCHEMA.*;$/\-- schema removed/g\"| #{restore_command(@config[:target][:conn])}"
        puts "Running: #{command}"
        return_code = system(command)
        raise "Error dumping and restoring! Please cleanup" if return_code != true
        get_tables(@config[:target]).reject{|t| t == "spatial_ref_sys"}.each do |table|
          puts "Cartodbfying table #{table}.."
          @cartodbfy_conn ||= PG.connect(@config[:target][:conn])
          puts @cartodbfy_conn.query("select cdb_cartodbfytable('#{@config[:target][:schema]}.#{table}')").to_a
        end
      end
    end
  end
end


require_relative 'utils'

module CartoDB
  module Relocator
    class Dumper
      include CartoDB::Relocator::Connections
      def initialize(params={})    
        @config = params[:config]
        #@source_db = params[:source_db] || PG.connect(@config[:source][:conn])
        #@target_db = params[:source_db] || PG.connect(@config[:target][:conn])
        @dbname = @config[:dbname]
        @username = @config[:username]
      end

      def dump_command(config)
        "pg_dump --verbose -F c -Z 0 #{Utils.conn_string(config)}"
      end

      def restore_command(config)
        "pg_restore -e --verbose --single-transaction --disable-triggers #{Utils.conn_string(config)}"
      end

      def superuser_conn
        superuser_conf = @config[:target][:conn].clone
        superuser_conf.merge!(:user => 'postgres', :dbname => 'postgres')
        @superuser_conn ||= PG.connect(superuser_conf)
      end

      def create_user(username, conn=@target_db)
        puts "Creating user #{username} on target db.."
        begin
          conn.query("CREATE ROLE \"#{username}\";
              ALTER ROLE \"#{username}\" WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION")
        rescue PG::Error
          puts "Object already exists!"
        end
      end

      def delete_user(username, conn=@target_db)
        puts "Deleting user #{username} on target db.."
        conn.query("DROP ROLE #{username};")
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
      
      def cleanup
      end

      def setup
        create_user(@username, superuser_conn)
        create_db(@config[:target][:conn][:dbname])
      end

      def migrate
        system("#{dump_command(@config[:source][:conn])} | #{restore_command(@config[:target][:conn])}")
      end
    end
  end
end


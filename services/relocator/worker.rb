# encoding: utf-8
require_relative './relocator'
module CartoDB
  module Relocator
    class Worker

      def self.perform(args = {})
        puts args
        job = CartoDB::Relocator::Job.find(args["id"])

        dump(job) if job.type == "dump"
        load(job) if job.type == "load"
      end #work


      def self.organize(user,org)
        port = ::Rails::Sequel.configuration.environment_for(Rails.env)['port']
        relocator = CartoDB::Relocator::Relocation.new(
          source: {conn: {host: user.database_host, port: port,
                          dbname: user.database_name,
                          user: 'postgres'}, schema: user.username}, #we will move 'public' to this schema
          target: {conn: {host: org.owner.database_host,  port: port,
                          dbname: org.owner.database_name, user: 'postgres'}, schema: user.username},
          redis: {host: Cartodb.config[:redis]['host'], port: Cartodb.config[:redis]['port']},
          dbname: user.database_name, username: user.database_username, :mode => :organize,
          user_object: user
        )
        begin
          # --------------- we first move the user to its own schema
          case user.database_schema
          when 'public'
            #associate it to the organization now so it lets create the public_user
            #on the schema.
            user.organization = org
            user.database_schema = user.username
            user.in_database(as: :superuser) do |database|
              database['ALTER SCHEMA public RENAME TO '+user.username].all
              # An apple a day keeps PostGIS away
              database['CREATE SCHEMA public; ALTER EXTENSION postgis SET SCHEMA public'].all
            end
            user.set_database_search_path
            user.create_public_db_user
            user.organization = nil
            user.save_metadata
            user.setup_schema
            User.terminate_database_connections(user.database_name, user.database_host)
            user.save
            puts "Migrated to schema-powered successfully!"
          when user.username
            puts "User is already on its own, non-public schema."
          else
            raise "User is on a different schema than expected."
          end

          # --------------- then move the user to its new place
          old_database_host = user.database_host
          old_database_name = user.database_name
          user.database_host = org.owner.database_host
          user.database_schema = user.username
          user.database_name = org.owner.database_name
          user.organization = org
          Thread.new do 
            begin
              user.create_db_user
            rescue => e
              puts "Error #{e} while creating user. Ignoring as it probably already existed"
            end
            # TODO: remove, connect permission is now granted to org read user
            if user.organization == nil
              user.grant_user_in_database
            end
          end.join
          begin
            user.create_public_db_user
          rescue => e
            puts "Error #{e} while creating public user. Ignoring as it probably already existed"
          end
          user.monitor_user_notification
          user.create_user_schema
          user.set_database_search_path
          #User.terminate_database_connections(user.database_name, user.database_host)
          relocator.migrate
          user.setup_schema
          #wipe all OIDs
          user.tables.update({:table_id =>nil})
          relocator.compare
          relocator.finalize
          relocator.check_org_user(user)
          User.terminate_database_connections(old_database_name, old_database_host)
          relocator.cleanup
        rescue => e
          puts "Error: #{e}, #{e.backtrace}"
          puts "Rolling back in 5 secs"
          sleep 5
          relocator.rollback
          return
        end
        user.save
        user.create_in_central
        user.update_in_central
      end # organize
      
      def self.relocate(user, new_database_host, new_database_port=nil)
        port = ::Rails::Sequel.configuration.environment_for(Rails.env)['port']
        new_database_port ||= port
        relocator = CartoDB::Relocator::Relocation.new(
          source: {conn: {host: user.database_host, port: port,
                          dbname: user.database_name,
                          user: 'postgres'}},
          target: {conn: {host: new_database_host,  port: new_database_port,
                          dbname: user.database_name, user: 'postgres'}},
          redis: {host: Cartodb.config[:redis]['host'], port: Cartodb.config[:redis]['port']},
          dbname: user.database_name, username: user.database_username,
          user_object: user, mode: :relocate
        )
        begin
          user.database_host = new_database_host
          relocator.setup
          user.monitor_user_notification
          relocator.migrate
          user.set_statement_timeouts
          relocator.compare
          puts user.save #this will terminate all connections
          relocator.finalize
        rescue => e
          puts "Error: #{e}, #{e.backtrace}"
          puts "Rolling back (changing back database_host and dropping triggers) in 5 secs"
          sleep 5
          relocator.rollback
        end
      end # dump
    end
  end
end

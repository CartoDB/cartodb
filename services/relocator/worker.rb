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
                          user: 'postgres'}, schema: 'public'},
          target: {conn: {host: org.owner.database_host,  port: port,
                          dbname: org.owner.database_name, user: user.database_username}, schema: user.username},
          redis: {host: Cartodb.config[:redis]['host'], port: Cartodb.config[:redis]['port']},
          dbname: user.database_name, username: user.database_username, :mode => :organize
        )
        begin
          user.database_host = org.owner.database_host
          user.database_name = org.owner.database_name
          user.organization = org
          user.database_schema = user.username
          begin
            user.create_db_user
          rescue => e
            puts "Error #{e} while creating user. Ignoring as it probably already existed"
          end
          user.monitor_user_notification
          user.create_user_schema
          user.set_database_search_path
          user.grant_user_in_database
          user.set_user_privileges_in_cartodb_schema
          relocator.migrate
          relocator.finalize
          user.create_public_db_user
          user.set_user_privileges
          user.set_user_as_organization_member
          user.save
        rescue => e
          puts "Error: #{e}, #{e.backtrace}"
          puts "Rolling back (changing back database_host and dropping triggers) in 5 secs"
          sleep 5
          relocator.rollback
        end
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
          dbname: user.database_name, username: user.database_username
        )
        begin
          relocator.migrate
          user.database_host = new_database_host
          puts user.save #this will terminate all connections
          user.enable_remote_db_user
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

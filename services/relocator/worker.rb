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


      def self.relocate(user, new_database_host, new_database_port=nil)
        port = ::Rails::Sequel.configuration.environment_for(Rails.env)['port']
        new_database_port ||= port
        old_database_host = user.database_host
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

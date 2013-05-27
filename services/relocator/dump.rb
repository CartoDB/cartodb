# encoding: utf-8
require 'open3'
require_relative './relocation'
require_relative './environment'
require_relative './meta_dumper'
require_relative './rdbms'
require_relative './helpers'

module CartoDB
  module Relocator
    class Dump
      include Helpers

      def initialize(arguments)
        @pg_dump      = arguments.fetch(:pg_dump)
        @user_id      = arguments.fetch(:user_id)
        @relocation   = Relocation.new
        @environment  = Environment.new(arguments.fetch(:environment), user_id)
        @rdbms        = RDBMS.new(arguments.fetch(:connection))
        @meta_dumper  = MetaDumper.new(
                          user_id:      user_id,
                          relocation:   relocation,
                          environment:  environment,
                          rdbms:        rdbms
                        )
      end #initialize

      def run
        to_stdout("Started relocation with ID: #{relocation.id}")
        to_stdout("Dumping user metadata")
        meta_dumper.run

        to_stdout("Renaming database user to a token")
        rdbms.rename_user(environment.database_username, relocation.token)

        to_stdout("Dumping data from #{environment.user_database}")
        dump(environment.user_database)

        to_stdout("Uploading data bundle to remote storage")
        relocation.zip
        relocation.upload
        to_stdout("Data bundle uploaded")

        to_stdout("Renaming database user to original name")
        rdbms.rename_user(relocation.token, environment.database_username)

        to_stdout("Finished dump stage for relocation ID: #{relocation.id}")
      #rescue => exception
        #puts exception
        #rdbms.rename_user(relocation.token, environment.database_username)
      end #run

      private

      attr_reader :pg_dump, :user_id, :relocation, :rdbms, :meta_dumper,
                  :environment

      def dump(database_name)
        configuration = Rails.configuration.database_configuration
        host          = configuration[Rails.env]["host"]
        database      = configuration[Rails.env]["database"]
        username      = configuration[Rails.env]["username"]
        password      = configuration[Rails.env]["password"]
        command       = "#{pg_dump} -U #{username} -w #{database_name}"

        Open3.popen3(command) do |stdin, stdout, stderr, process| 
          relocation.store('dump.sql', stdout)
          print_and_raise(stderr) unless process.value.to_s =~ /exit 0/
        end
      end #dump_database
    end # Dump
  end # Relocator
end # CartoDB


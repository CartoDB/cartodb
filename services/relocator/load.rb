# encoding: utf-8
require 'stringio'
require 'open3'
require 'json'
require_relative 'relocator'
require_relative './relocation'
require_relative './environment'
require_relative './meta_loader'
require_relative './rdbms'
require_relative './helpers'

module CartoDB
  module Relocator
    class Load
      include DataRepository
      include Helpers

	    PG_BOUNCER_UPDATER = "/usr/local/bin/regenerate.pgbouncer.pg_auth"

      def initialize(arguments)
        @psql             = arguments.fetch(:psql)
        @database_owner   = arguments.fetch(:database_owner)
        @relocation       = Relocation.new(arguments.fetch(:relocation_id))
        @rdbms            = RDBMS.new(arguments.fetch(:connection))
        @environment      = arguments.fetch(:environment)
        @new_username     = arguments.fetch(:new_username, nil)
        @renaming         = !!new_username
        @meta_loader      = MetaLoader.new(
                              relocation:   relocation,
                              rdbms:        rdbms,
                              renaming:     renaming
                            )
      end #initialize

      def run
        to_stdout("Continuing relocation with ID: #{relocation.id}")
        to_stdout("Downloading data bundle from remote storage")
        relocation.download
        to_stdout("Data bundle downloaded from remote storage")

        to_stdout('Unzipping data bundle')
        relocation.unzip

        to_stdout("Creating user with downloaded attributes")
        create_user

        to_stdout("Creating user database #{user.database_name}")
        rdbms.create_database(user.database_name, database_owner)

        to_stdout("Creating temporary database user")
        rdbms.create_user(relocation.token, user.database_password)
        
        to_stdout("Loading data from filesystem to #{user.database_name}")
        load_database

        to_stdout("Renaming database user")
        rdbms.rename_user(relocation.token, environment.database_username)

        to_stdout("Setting password for database user")
        rdbms.set_password(environment.database_username, user.database_password)
        `#{PG_BOUNCER_UPDATER}` if ENV[RAILS_ENV] == 'staging'
        to_stdout("sleeping")
	      sleep 20
        to_stdout("Loading metadata")
        meta_loader.user = user
        meta_loader.environment = environment
        meta_loader.run

        to_stdout("Finished relocation with ID: #{relocation.id}")
      end #run

      private

      attr_reader :relocation, :user, :psql, :environment, :database_owner,
                  :rdbms, :meta_loader, :new_username, :renaming

      def create_user
        @user = User.new
        def user.after_create; end

        payload    = relocation.fetch('users').readlines.join
        attributes = ::JSON.parse(payload).first
        attributes.delete('id')
        attributes.each { |k, v| @user.send(:"#{k}=", v) }

        if new_username
          @user.username = new_username 
          @user.email    = "#{@user.email}_#{relocation.token}_#{Time.now.to_i}"
        end
        raise 'Invalid user' unless user.valid?
        user.save
        @environment        = Environment.new(environment, user.id)
        user.database_name  = environment.user_database
        user.save
      end #create_user

      def load_database
        dump    = File.join(Relocator::TMP_DIR, relocation.path_for('dump.sql'))
        command = "#{psql} -U postgres #{user.database_name} < #{dump}"

        `#{command}`
        puts $?
        #Open3.popen3(command) do |stdin, stdout, stderr, process| 
        #  print_and_raise(stderr) unless process.value.to_s =~ /exit 0/
        #end
      end #load_database
    end # Load
  end # Relocator
end # CartoDB


# encoding: utf-8
require 'stringio'
require 'open3'
require 'uuidtools'
require 'json'
require 'pg'
require_relative './helpers'
require_relative '../../../services/data-repository/filesystem/s3/backend'
require_relative '../../../services/data-repository/filesystem/local'

module CartoDB
  module Relocator
    class Load
      include DataRepository
      include Helpers

      def initialize(arguments)
        @environment          = arguments.fetch(:environment)
        @psql_command         = arguments.fetch(:psql_command)
        @relocation_id        = arguments.fetch(:relocation_id)
        @tmp_dir              = File.join(File.dirname(__FILE__), '..',
                                '..', '..', 'tmp', 'relocator')
        @local_filesystem     = arguments.fetch(:local, default_local)
        @remote_filesystem    = arguments.fetch(:remote, default_remote)
        @rdbms                = RDBMS.new(arguments.fetch(:connection))
        @database_owner       = arguments.fetch(:database_owner)
        @dump_path            = "#{relocation_id}/user_db.sql"
        @user_attributes_path = "#{relocation_id}/user.json"
      end #initialize

      def run
        to_stdout("Continuing relocation with ID: #{relocation_id}")
        to_stdout("Downloading data from Amazon S3")
        download_from_remote(dump_path)
        to_stdout("Data downloaded from Amazon S3")

        to_stdout("Downloading user attributes from Amazon S3")
        download_from_remote(user_attributes_path)

        to_stdout("Creating user with downloaded attributes")
        create_user

        to_stdout("Creating user database #{user.database_name}")
        rdbms.create_database(user.database_name, database_owner)

        to_stdout("Loading data from filesystem to #{user.database_name}")
        load_database

        to_stdout("Renaming database user")
        rdbms.rename_user(token, database_username_for(user.id))

        to_stdout("Setting password for database user")
        rdbms.set_password(database_username_for(user.id), user.database_password)

        to_stdout("Finished relocation with ID: #{relocation_id}")
      end #run

      private

      attr_reader :local_filesystem, :remote_filesystem, :relocation_id,
                  :dump_path, :user, :user_attributes_path, :psql_command, 
                  :environment, :database_owner, :rdbms

      def create_user
        @user = User.new
        def user.after_create; end

        json_attributes = local_filesystem.fetch(user_attributes_path)
                            .readlines.join
        JSON.parse(json_attributes).each { |k, v| @user.send(:"#{k}=", v) }

        raise 'Invalid user' unless user.valid?
        user.save
        user.database_name = user_database_for(user.id)
        user.save
      end #create_user

      def load_database
        dump      = File.join(@tmp_dir, dump_path)
        command   = "#{psql_command} #{user.database_name} < #{dump}"

        `#{command}`
        puts $?
        #Open3.popen3(command) do |stdin, stdout, stderr, process| 
        #  print_and_raise(stderr) unless process.value.to_s =~ /exit 0/
        #end
      end #load_database

      def download_from_remote(path)
        local_filesystem.store(path, remote_filesystem.fetch(url_for(path)) )
      end #download_from_remote

      def default_local
        Filesystem::Local.new(@tmp_dir)
      end #default_local

      def default_remote
        Filesystem::S3::Backend.new
      end #default_remote
    end # Load
  end # Relocator
end # CartoDB


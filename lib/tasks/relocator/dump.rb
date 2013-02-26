# encoding: utf-8
require 'stringio'
require 'open3'
require 'uuidtools'
require 'json'
require 'pg'
require_relative './helpers'
require_relative './rdbms'
require_relative '../../../services/data-repository/filesystem/s3/backend'
require_relative '../../../services/data-repository/filesystem/local'

module CartoDB
  module Relocator
    class Dump
      include DataRepository
      include Helpers

      def initialize(arguments)
        @environment          = arguments.fetch(:environment)
        @pg_dump_command      = arguments.fetch(:pg_dump_command)
        @user_id              = arguments.fetch(:user_id)
        @local_filesystem     = arguments.fetch(:local, default_local)
        @remote_filesystem    = arguments.fetch(:remote, default_remote)
        @rdbms                = RDBMS.new(arguments.fetch(:connection))

        @relocation_id        = UUIDTools::UUID.timestamp_create
        @dump_path            = "#{relocation_id}/user_db.sql"
        @user_attributes_path = "#{relocation_id}/user.json"
      end #initialize

      def run
        to_stdout("Started relocation with ID: #{relocation_id}")
        to_stdout("Renaming database user")
        rdbms.rename_user(database_username_for(user_id), token)

        to_stdout("Dumping data from #{user_database_for(user_id)} 
                  to local filesytem")
        dump_database

        to_stdout("Dumping user attributes to local filesystem")
        dump_user_attributes

        to_stdout("Uploading database dump to Amazon S3")
        upload_to_remote(dump_path)
        to_stdout("Database dump uploaded to Amazon S3")

        to_stdout("Uploading user attributes to Amazon S3")
        upload_to_remote(user_attributes_path)
        to_stdout("User attributes uploaded to Amazon S3")

        to_stdout("Finished dump stage for relocation ID: #{relocation_id}")
      end #run

      private

      attr_reader :local_filesystem, :remote_filesystem, :relocation_id,
                  :pg_dump_command, :dump_path, :rdbms, :user_id, 
                  :user_attributes_path, :environment

      def dump_database
        command = "#{pg_dump_command} #{user_database_for(user_id)}"

        Open3.popen3(command) do |stdin, stdout, stderr, process| 
          local_filesystem.store(dump_path, stdout)
          print_and_raise(stderr) unless process.value.to_s =~ /exit 0/
        end
      end #dump_database

      def dump_user_attributes
        user_attributes = User[user_id].to_hash
        user_attributes.delete(:id)
        data = StringIO.new(user_attributes.to_json)
        local_filesystem.store(user_attributes_path, data)
      end #dump_user_attributes

      def upload_to_remote(path)
        remote_filesystem.store(path, local_filesystem.fetch(path))
      end #upload_to_remote

      def default_local
        tmp_dir = File.join(
          File.dirname(__FILE__), '..', '..', '..', 'tmp', 'relocator'
        )

        Filesystem::Local.new(tmp_dir)
      end #default_local

      def default_remote
        Filesystem::S3::Backend.new
      end #default_remote
    end # Dump
  end # Relocator
end # CartoDB


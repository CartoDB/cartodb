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
    class Dump
      include DataRepository
      include Helpers

      def initialize(arguments)
        @connection           = Rails::Sequel.connection
        @user_id              = arguments.fetch(:user_id)
        @pg_dump_command      = arguments.fetch(:pg_dump)

        @relocation_id        = UUIDTools::UUID.timestamp_create
        @user_database        = user_database_for(user_id)

        @tmp_dir               = File.join(File.dirname(__FILE__), '..',
                                '..', '..', 'tmp', 'relocator')
        @local_filesystem     = Filesystem::Local.new(@tmp_dir)
        @s3_filesystem        = Filesystem::S3::Backend.new

        @dump_path            = "#{relocation_id}/user_db.sql"
        @user_attributes_path = "#{relocation_id}/user.json"
      end #initialize

      def run
        to_stdout("Started relocation with ID: #{relocation_id}")
        to_stdout("Renaming database user")
        rename_database_user

        to_stdout("Dumping data from #{user_database} to local filesytem")
        dump_database

        to_stdout("Dumping user attributes to local filesystem")
        dump_user_attributes

        to_stdout("Uploading database dump to Amazon S3")
        upload_to_s3(dump_path)
        to_stdout("Database dump uploaded to Amazon S3")

        to_stdout("Uploading user attributes to Amazon S3")
        upload_to_s3(user_attributes_path)
        to_stdout("User attributes uploaded to Amazon S3")

        to_stdout("Finished relocation with ID: #{relocation_id}")
      end #run

      private

      attr_reader :local_filesystem, :s3_filesystem, :relocation_id,
                  :user_database, :pg_dump_command, :dump_path, 
                  :user_id, :user_attributes_path, :connection

      def rename_database_user
        connection.run(rename_database_user_sql)
      end #rename_database_user

      def rename_database_user_sql
        "ALTER USER development_cartodb_user_#{user_id}
        RENAME TO token#{relocation_id.to_s.delete('-')}"
      end #rename_database_user_sql

      def dump_database
        command = "#{pg_dump_command} #{user_database}"

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

      def upload_to_s3(path)
        puts s3_filesystem.store(path, local_filesystem.fetch(path))
      end #upload_to_s3
    end # Dump
  end # Relocator
end # CartoDB


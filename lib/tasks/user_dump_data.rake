# encoding: utf-8
require 'open3'
require 'uuidtools'
require 'json'
require 'stringio'
#require_relative '../../app/models/user'
require_relative '../../services/data-repository/filesystem/s3/backend'
require_relative '../../services/data-repository/filesystem/local'

namespace :user do
  desc 'Dump user data from CartoDB and upload it to S3'
  task :dump_data, [:user_id] => [:environment] do |task, args|
    PG_DUMP_COMMAND = "pg_dump"

    module UserMigration
      class Dump
        include DataRepository

        def initialize(command, user_id)
          @local_filesystem     = Filesystem::Local.new('/var/tmp')
          @s3_filesystem        = Filesystem::S3::Backend.new
          @migration_id         = UUIDTools::UUID.timestamp_create
          @user_id              = user_id
          @user_database        = user_database_for(user_id)
          @command              = "#{command} #{user_database}"
          @dump_path            = "#{migration_id}/user_db.sql"
          @user_attributes_path = "#{migration_id}/user.json"
        end #initialize

        def run
          to_stdout("Started migration with ID: #{migration_id}")
          to_stdout("Dumping data from #{user_database} to local filesytem")
          dump_db

          to_stdout("Dumping user attributes to local filesystem")
          dump_user_attributes

          to_stdout("Uploading database dump to Amazon S3")
          upload_to_s3(dump_path)
          to_stdout("Database dump uploaded to Amazon S3")

          to_stdout("Uploading user attributes to Amazon S3")
          upload_to_s3(user_attributes_path)
          to_stdout("User attributes uploaded to Amazon S3")

          to_stdout("Finished migration with ID: #{migration_id}")
        end #run

        private

        attr_reader :local_filesystem, :s3_filesystem, :migration_id,
                    :user_database, :command, :dump_path, :user_id,
                    :user_attributes_path

        def dump_db
          Open3.popen3(command) do |stdin, stdout, stderr, process| 
            local_filesystem.store(dump_path, stdout)
            print_and_raise(stderr) unless process.value.to_s =~ /exit 0/
          end
        end #dump_db

        def dump_user_attributes
          user_attributes = User[user_id].to_hash
          user_attributes.delete(:id)
          data = StringIO.new(user_attributes.to_json)
          local_filesystem.store(user_attributes_path, data)
        end #dump_user_attributes

        def upload_to_s3(path)
          puts s3_filesystem.store(path, local_filesystem.fetch(path))
        end #upload_to_s3

        def user_database_for(user_id)
          "cartodb_dev_user_#{user_id}_db"
        end #user_database

        def to_stdout(text)
          marker = '=' * 10
          puts [Time.now, marker, text].join(' ')
        end #to_stdout

        def print_and_raise(stderr)
          puts
          puts '*' * 80
          puts
          puts ' ' * 10 + "COMMAND EXITED WITH ERRORS"
          puts
          puts stderr.read
          puts
          puts '*' * 80
          puts
          raise 'Command exited with errors'
        end #print_and_raise
      end # Dump
    end # UserMigration

    UserMigration::Dump.new(PG_DUMP_COMMAND, args[:user_id]).run
  end # dump_data
end # user


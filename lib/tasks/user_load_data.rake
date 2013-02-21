# encoding: utf-8
require 'open3'
require 'uuidtools'
require 'json'
require 'pg'
require_relative '../../services/data-repository/filesystem/s3/backend'
require_relative '../../services/data-repository/filesystem/local'

namespace :user do
  desc 'Load user data from CartoDB and upload it to S3'
  task :load_data, [:migration_id] => [:environment] do |task, args|
    PG_LOAD_COMMAND = "psql"

    module UserMigration
      class Load
        include DataRepository

        def initialize(command, migration_id)
          @local_filesystem     = Filesystem::Local.new('/var/tmp')
          @s3_filesystem        = Filesystem::S3::Backend.new
          @migration_id         = migration_id
          @dump_path            = "#{@migration_id}/user_db.sql"
          @user_attributes_path = "#{@migration_id}/user.json"
        end #initialize

        def run
          to_stdout("Continuing migration with ID: #{migration_id}")

          to_stdout("Downloading data from Amazon S3")
          download_from_s3(dump_path)
          to_stdout("Data downloaded from Amazon S3")

          to_stdout("Downloading user attributes from Amazon S3")
          download_from_s3(user_attributes_path)

          to_stdout("Creating user with downloaded attributes")
          create_user

          #@command              = "#{command} #{user_database}"
          to_stdout("Loading data from local filesystem to #{user_database}")
          #load_db

          to_stdout("Finished migration with ID: #{migration_id}")
        end #run

        private

        attr_reader :local_filesystem, :s3_filesystem, :migration_id,
                    :user_database, :command, :dump_path, :user,
                    :user_attributes_path

        def create_user
          json_attributes = 
            local_filesystem.fetch(user_attributes_path).readlines.join
          @user = User.new
          def @user.after_create; end

          JSON.parse(json_attributes).each { |k, v| @user.send(:"#{k}=", v) }
            
          @user.save
          raise 'Invalid user' unless @user.valid?
          @user_database = user_database_for(user.id)
          p @user_database
          #`createdb -p 5433 #{@user_databse}`
        end #create_user

        def load_db
          Open3.popen3(command) do |stdin, stdout, stderr, process| 
            local_filesystem.store(dump_path, stdout)
            print_and_raise(stderr) unless process.value.to_s =~ /exit 0/
          end
        end #load_db

        def download_from_s3(path)
          url = url_for(path)
          local_filesystem.store(path, s3_filesystem.fetch(url))
        end #download_from_s3

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

        def url_for(path)
          bucket = ENV['S3_BUCKET']
          "https://s3.amazonaws.com/#{bucket}/#{path}"
        end #url_for
      end # Load
    end # UserMigration

    UserMigration::Load.new(PG_LOAD_COMMAND, args[:migration_id]).run
  end # load_data
end # user


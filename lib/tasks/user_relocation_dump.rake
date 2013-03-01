# encoding: utf-8
require_relative './relocator/dump'
require_relative './relocator/meta_dumper'

namespace :user do
  namespace :relocation do
    desc 'Dump user data from CartoDB and upload it to S3'
    task :dump, [:user_id] => [:environment] do |task, args|
      pg_dump_command =   "pg_dump"
      user_id         =   args[:user_id]
      environment     =   Rails.env
      connection      =   Rails::Sequel.connection

      dump = CartoDB::Relocator::Dump.new(
        pg_dump_command:  pg_dump_command,
        user_id:          user_id,
        environment:      environment,
        connection:       connection
      )#.run

      meta_dumper = CartoDB::Relocator::MetaDumper.new(
        user_id:    user_id,
        connection: connection,
        token:      dump.send(:relocation_id)    
      )

      meta_dumper.api_keys
      meta_dumper.assets
      meta_dumper.client_applications
      meta_dumper.layers_users
      meta_dumper.data_imports
      meta_dumper.maps
      meta_dumper.oauth_tokens
      meta_dumper.users
    end # dump
  end # relocate
end # user


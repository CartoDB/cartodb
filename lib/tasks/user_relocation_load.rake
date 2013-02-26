# encoding: utf-8
require_relative './relocator/load'

namespace :user do
  namespace :relocation do
    desc 'Load user data from CartoDB and upload it to S3'
    task :load, [:relocation_id] => [:environment] do |task, args|
      port            = Rails.configuration.database_configuration
                          .fetch(Rails.env)
                          .fetch('port')
      connection      = Rails::Sequel.connection
      environment     = Rails.env
      relocation_id   = args[:relocation_id]
      psql_command    = "psql -p #{port}"
      database_owner  = Rails.configuration.database_configuration
                          .fetch(Rails.env)
                          .fetch('username')


      CartoDB::Relocator::Load.new(
        psql_command:   psql_command,
        relocation_id:  relocation_id,
        environment:    environment,
        connection:     connection,
        database_owner: database_owner
      ).run
    end # load
  end # relocate
end # user


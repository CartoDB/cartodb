# encoding: utf-8
require_relative '../../services/relocator/load'

namespace :user do
  namespace :relocation do
    desc 'Load user data from CartoDB and upload it to S3'
    task :load, [:relocation_id, :new_username] => [:environment] do |task, args|
      database_configuration  = Rails.configuration.database_configuration
                                  .fetch(Rails.env)
      port                    = database_configuration.fetch('port')
      database_owner          = database_configuration.fetch('username')

      CartoDB::Relocator::Load.new(
        psql:                 "psql -p #{port}",
        relocation_id:        args[:relocation_id],
        new_username:         args[:new_username],
        environment:          Rails.env,
        connection:           Rails::Sequel.connection,
        database_owner:       database_owner
      ).run
    end # load
  end # relocate
end # user


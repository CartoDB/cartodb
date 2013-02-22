# encoding: utf-8
require_relative './relocator/load'

namespace :user do
  namespace :relocate do
    desc 'Load user data from CartoDB and upload it to S3'
    task :load, [:relocation_id] => [:environment] do |task, args|
      psql      = "psql -p 5433"

      CartoDB::Relocator::Load.new(
        psql:           psql,
        relocation_id:  args[:relocation_id]
      ).run
    end # load
  end # relocate
end # user


# encoding: utf-8
require_relative './relocator/dump'

namespace :user do
  namespace :relocate do
    desc 'Dump user data from CartoDB and upload it to S3'
    task :dump, [:user_id] => [:environment] do |task, args|
        pg_dump = "pg_dump"

        CartoDB::Relocator::Dump.new(
          pg_dump: pg_dump,
          user_id: args[:user_id]
        ).run
    end # dump
  end # relocate
end # user


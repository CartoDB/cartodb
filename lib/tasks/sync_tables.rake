# encoding: utf-8

# This rake retrieves all sync tables that should get synchronized, and puts the synchronization tasks at Resque
# NOTE: This version does not mark the tables as "enqueued", should be done if planning to run multiple instances
namespace :cartodb do
  desc 'Runs the sync tables process'
  task :sync_tables, [:force_all_arg] => [:environment] do |task, args|
    puts '> Sync tables rake started'

    require_relative '../../services/synchronizer/lib/synchronizer/collection'

    CartoDB::Synchronizer::Collection.new.fetch(args[:force_all_arg].present? ? args[:force_all_arg] : false)

    puts '> Sync tables rake finished'
  end
end

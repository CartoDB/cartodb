# encoding: utf-8

# This rake retrieves all sync tables that should get synchronized, and puts the synchronization tasks at Resque
# NOTE: This version does not mark the tables as "enqueued", should be done if planning to run multiple instances
namespace :cartodb do
  desc 'Runs the sync tables process'
  task :sync_tables, [:force_all_arg] => [:environment] do |task, args|
    puts '> Sync tables started' if ENV['VERBOSE']

    require_relative '../../services/synchronizer/lib/synchronizer/collection'

    collection = CartoDB::Synchronizer::Collection.new

    collection.fetch(args[:force_all_arg].present? ? args[:force_all_arg] : false)

    collection.enqueue_stalled unless (args[:force_all_arg].present? && args[:force_all_arg])

    puts '> Sync tables finished' if ENV['VERBOSE']
  end
end

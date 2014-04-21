# encoding: utf-8

# This rake retrieves all sync tables that should get synchronized, and puts the synchronization tasks at Resque
# NOTE: This version does not mark the tables as "enqueued"
namespace :cartodb do
  desc 'Runs the sync tables process'
  task :sync_tables => :environment do
    puts 'Sync tables rake started'

    require_relative '../../services/synchronizer/lib/synchronizer/collection'

    CartoDB::Synchronizer::Collection.new.fetch

    puts 'Sync tables rake finished'
  end
end

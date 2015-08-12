# encoding: utf-8

namespace :cartodb do
  # This rake retrieves all sync tables that should get synchronized, and puts the synchronization tasks at Resque
  # NOTE: This version does not mark the tables as "enqueued", should be done if planning to run multiple instances
  desc 'Runs the sync tables process'
  task :sync_tables, [:force_all_arg] => [:environment] do |task, args|
    puts '> Sync tables started' if ENV['VERBOSE']

    require_relative '../../services/synchronizer/lib/synchronizer/collection'
    collection = CartoDB::Synchronizer::Collection.new

    # This fetches and enqueues
    collection.fetch_and_enqueue(args[:force_all_arg].present? ? args[:force_all_arg] : false)

    puts '> Sync tables finished' if ENV['VERBOSE']
  end


  desc 'Adds visualization_id to every Synchronization'
  task :populate_visualization_ids => [:environment] do |task, args|
    require_relative '../../services/synchronizer/lib/synchronizer/collection'
    collection = CartoDB::Synchronizer::Collection.new

    collection.fetch_all.each { |record|
      begin
        synchronization = CartoDB::Synchronization::Member.new(id: record[:id]).fetch
      rescue KeyError
        synchronization = nil
      end
      if synchronization
        begin
          table = UserTable.where({
              name: synchronization.name,
              user_id: synchronization.user_id
            }).first.service
        rescue => exception
          table = nil
          puts "\nSync id '#{record[:id]}' errored: #{exception.inspect}"
        end
        unless table.nil?
          if synchronization.visualization_id.nil?
            synchronization.visualization_id = table.table_visualization.id
            begin
              synchronization.store
              printf '.'
            rescue => exception
              puts "\nSync id '#{record[:id]}' errored: #{exception.inspect}"
            end
          else
            printf 'S'
          end
      end
      else
        puts "\nSync id '#{record[:id]}' errored: missing synchronization entry"
      end
    }



  end
end

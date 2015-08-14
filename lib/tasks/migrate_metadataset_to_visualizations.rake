require 'uri'
require_relative '../../app/models/common_data'

namespace :cartodb do
  namespace :db do
    desc "Populate license, source and tags fields using data from external_sources to their original imports for the common-data user"
    task :migrate_external_sources, [:user_id, :simulation] => :environment do |t, args|
      # We user external_sources because remote visualization don't have map or user_tables rows
      if args[:user_id].nil?
        puts "Use: rake cartodb:db:migrate_external_sources['user_id'[,true]]. User id should be the id for the common-data user"
        exit 1
      end
      common_datasets = get_datasets
      tabnames = common_datasets.keys.map{ |k| %Q['#{k}'] }.join(',')
      canonical_vis_sql = %Q[select v.id, v.name
                              FROM maps m
                              INNER JOIN visualizations v ON v.map_id = m.id
                              WHERE v.user_id = '#{args[:user_id]}'
                              AND v.type = 'table'
                              AND v.name IN (#{tabnames})]
      canonical_vis = Rails::Sequel.connection.fetch(canonical_vis_sql).all
      puts "Number of visualizations to update: #{canonical_vis.length}"
      rows_updated = 0
      error_rows = []
      canonical_vis.each do |vis_data|
        data = common_datasets[vis_data[:name]]
        begin
          vis = CartoDB::Visualization::Member.new(id: vis_data[:id]).fetch
          if args[:simulation]
            puts '[DATA]-----------------'
            puts data
            puts '[TABLE]----------------'
            puts CartoDB::Visualization::Presenter.new(vis).to_poro
            puts '------------------------------------------------------'
          else
            vis.license = data[:license]
            vis.source = data[:source]
            vis.tags = data[:tags]
            vis.display_name = data[:name]
            vis.description = data[:description]
            vis.store
            rows_updated += 1
          end
        rescue Exception => e
          CartoDB.notify_exception(e)
          error_rows << vis_data[:id]
        end
      end
      puts "Successfully updated rows: #{rows_updated}"
      puts "There were errors in the following rows: #{error_rows}" if !error_rows.empty?
    end
  end
end

def get_datasets
  common_datasets = CommonData.new.datasets
  datasets = {}
  common_datasets[:datasets].each do |dataset| 
    datasets[dataset["tabname"]] = dataset.deep_symbolize_keys
  end
  datasets
end

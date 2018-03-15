require_relative "../../app/model_factories/layer_factory"
require_relative "../../app/model_factories/map_factory"
require 'carto/mapcapped_visualization_updater'

namespace :cartodb do
  namespace :vizs do

    desc "Purges broken visualizations due to bug during deletion."
    task :delete_inconsistent, [:username] => :environment do |t, args|
      username = args[:username]
      raise "You should pass a username param" unless username
      user = ::User[username: username]
      collection = Carto::Visualization.where(user_id: user.id)

      collection.each do |viz|
        if inconsistent?(viz)
          delete_with_confirmation(viz)
        end
      end
    end

    desc "Create named maps for all eligible existing visualizations"
    task :create_named_maps, [:order] => :environment do |t, args|
      sort_order = args[:order] == ':desc' ? :desc : :asc
      puts "Retrieving by :created_at #{sort_order}"

      puts "> #{Time.now}"

      vqb = Carto::VisualizationQueryBuilder.new
                                            .with_types([
                                                Carto::Visualization::TYPE_CANONICAL,
                                                Carto::Visualization::TYPE_DERIVED
                                              ])
                                            .with_order(:created_at, sort_order)
                                            .build

      count = vqb.count
      current = 0

      puts "Fetched ##{count} items"
      puts "> #{Time.now}"

      vqb.each do |vis|
        begin
          current += 1

          Carto::NamedMaps::Api.new(vis).upsert
          if current % 50 == 0
            print '.'
          end
          if current % 500 == 0
            puts "\n> #{Time.now} #{current}/#{count}"
          end
          vis = nil
        rescue => ex
          printf "E"
        end
      end

      puts "\n> #{Time.now}\nFinished ##{count} items"
    end

    desc "Outputs a visualization JSON. Usage example: `bundle exec rake cartodb:vizs:export_user_visualization_json['c54710aa-ad8f-11e5-8046-080027880ca6'] > c54710aa-ad8f-11e5-8046-080027880ca6.json`"
    task :export_user_visualization_json, [:vis_id] => :environment do |_, args|
      # Output is meant to be forwarded to a file, so we don't want logging output
      ActiveRecord::Base.logger = nil
      vis_id = args[:vis_id]
      raise "vis_id argument missing" unless vis_id

      puts Carto::VisualizationsExportService.new.export_to_json(Carto::Visualization.find(vis_id))
    end

    desc "Imports a visualization JSON from input (from export_user_visualization_json). Usage example: `cat c54710aa-ad8f-11e5-8046-080027880ca6.json | bundle exec rake cartodb:vizs:import_user_visualization_json['6950b745-5524-4d8d-9478-98a8a04d84ba']`. Ids are preserved, so if you want to import an existing visualization you must edit the JSON file and change the ids (any valid UUID will work)."
    task :import_user_visualization_json, [:user_id] => :environment do |_, args|
      json_string = STDIN.gets
      json = JSON.parse(json_string)

      user_id = args[:user_id]
      raise "user_id argument missing" unless user_id

      user = Carto::User.find(user_id)

      json["owner"]["id"] = user_id
      json["layers"].each do |layer|
        if layer.fetch("options", {}).fetch("user_name", nil)
          layer["options"]["user_name"] = user.username
        end
      end

      Carto::VisualizationsExportService.new.restore_from_json(json)
    end

    desc "Exports/Backups a visualization"
    task :export_user_visualization, [:vis_id] => :environment do |_, args|
      vis_export_service = Carto::VisualizationsExportService.new

      puts "Exporting visualization #{args[:vis_id]}..."
      result = vis_export_service.export(args[:vis_id])
      puts "Export result was: #{result ? 'OK' : 'NOK (export already present)'}"
      puts "Export complete"
    end

    desc "Imports/Restores a visualization"
    task :import_user_visualization, [:vis_id, :skip_version_check] => :environment do |_, args|
      vis_export_service = Carto::VisualizationsExportService.new

      skip_version_check = (args[:skip_version_check] == "true")

      puts "Importing visualization data for uuid #{args[:vis_id]}"
      vis_export_service.import(args[:vis_id], skip_version_check)

      puts "Visualization #{args[:vis_id]} imported"
    end

    desc "Exports a .carto file including visualization metadata and the tables"
    task :export_full_visualization, [:vis_id] => :environment do |_, args|
      visualization_id = args[:vis_id]
      raise "Missing visualization id argument" unless visualization_id

      visualization = Carto::Visualization.where(id: visualization_id).first
      raise "Visualization not found" unless visualization

      file = Carto::VisualizationExport.new.export(visualization, visualization.user)
      puts "Visualization exported: #{file}"
    end

    desc "Purges old visualization backups"
    task :purge_old_visualization_backups => :environment do |_|
      vis_export_service = Carto::VisualizationsExportService.new

      puts "Purging visualization backups older tan #{Carto::VisualizationsExportService::DAYS_TO_KEEP_BACKUP} days"

      purged_count = vis_export_service.purge_old

      puts "Purge complete. Removed #{purged_count} items"
    end

    desc "Updates visualizations auth tokens from named maps"
    task update_auth_tokens: :environment do |_|
      Carto::Visualization.find_each(conditions: "privacy = 'password'") do |visualization|
        puts "Updating #{visualization.id}"
        begin
          tokens = visualization.get_auth_tokens
          puts "  from #{visualization.auth_token} to #{tokens.first}"
          visualization.update_column(:auth_token, tokens.first)
        rescue => e
          puts "ERROR #{e.inspect}"
        end
      end
    end

    desc "Have all Builder visualizations mapcapped. Dry mode: `bundle exec rake cartodb:vizs:mapcap_builder_visualizations['--dry']`"
    task :mapcap_builder_visualizations, [:dry] => :environment do |_, args|
      dry = args[:dry] == '--dry'

      puts "Mapcapping v3 visualizations. Dry mode #{dry ? 'on' : 'off'}"

      Carto::Visualization.find_each(conditions: "version = 3 and type = 'derived' and privacy != 'private'") do |visualization|
        begin
          if !visualization.mapcapped?
            puts "Mapcapping #{visualization.id}"
            Carto::Mapcap.create!(visualization_id: visualization.id) unless dry
          end
        rescue => e
          puts "ERROR mapcapping #{visualization}: #{e.inspect}"
        end
      end
    end

    desc "Create analyses for all v3 visualizations"
    task :create_analyses_for_v3_visualizations, [:dry] => :environment do |_, args|
      include Carto::MapcappedVisualizationUpdater
      dry = args[:dry] == '--dry'

      puts "Adding analyses to v3 visualizations. Dry mode #{dry ? 'on' : 'off'}"

      puts "=== STEP 1/2: Visualizations ==="
      v3_no_analyses = Carto::Visualization.joins('LEFT JOIN analyses ON visualizations.id = analyses.visualization_id')
                                           .where(version: 3, type: 'derived', analyses: { id: nil })

      v3_no_analyses.find_each do |visualization|
        begin
          puts "Adding analyses to visualization #{visualization.id}"
          visualization.add_source_analyses unless dry
        rescue => e
          puts "ERROR adding analyses to visualization #{visualization.id}: #{e.inspect}"
        end
      end

      puts "=== STEP 2/2: Mapcaps ==="
      mapcap_no_analyses = Carto::Mapcap.where("json_array_length(export_json->'visualization'->'analyses') = 0")

      mapcap_no_analyses.find_each do |mapcap|
        puts "Adding analyses to mapcap #{mapcap.id}"
        unless dry
          begin
            rv = mapcap.regenerate_visualization

            rv.data_layers.each_with_index do |layer, index|
              analysis = Carto::Analysis.source_analysis_for_layer(layer, index)
              rv.analyses << analysis
              layer.options[:source] = analysis.natural_id
              layer.options[:letter] = analysis.natural_id.first
            end

            mapcap.export_json = export_in_memory_visualization(rv, rv.user)
            mapcap.save
          rescue => e
            puts "ERROR adding analyses to mapcap: #{mapcap.id}: #{e.inspect}"
          end
        end
      end
    end

    private

    def inconsistent?(viz)
      (viz.table? && viz.related_tables.empty?) || (viz.derived? && viz.map.nil?)
    end

    def delete_with_confirmation(viz)
      display_info(viz)
      if ok_to_delete?
        viz.delete
        STDOUT.puts "deleted!"
      end
    end

    def display_info(viz)
      STDOUT.puts "\nviz.name = #{viz.name}"
      STDOUT.puts "viz.type = #{viz.type}"
      STDOUT.puts "viz.related_tables = #{viz.related_tables.map {|t| t.name}}"
      STDOUT.puts "viz.map_id = #{viz.map_id}"
    end

    def ok_to_delete?
      STDOUT.puts "About to delete. Are you sure? (y/n)"
      input = STDIN.gets.strip
      return input == 'y'
    end

  end
end

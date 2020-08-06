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

    desc "Purges broken canonical visualizations without related tables"
    task :delete_inconsistent_canonical_viz_without_tables => :environment do |_|
      Carto::Visualization.joins("left join user_tables ut on visualizations.map_id = ut.map_id").where("visualizations.type = 'table' and ut.id is null").find_each do |viz|
        begin
          puts "Checking for deletion --> User: #{viz.user.username} | Viz id: #{viz.id}"
          if inconsistent_table?(viz)
            puts "Deleting viz --> User: #{viz.user.username} | Viz id: #{viz.id}"
            viz.destroy!
          end
        rescue StandardError => e
          puts "Error deleting viz #{viz.id}: #{e}"
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
        rescue StandardError => ex
          printf "E"
        end
      end

      puts "\n> #{Time.now}\nFinished ##{count} items"
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

    desc "Updates visualizations auth tokens from named maps"
    task update_auth_tokens: :environment do |_|
      Carto::Visualization.find_each(conditions: "privacy = 'password'") do |visualization|
        puts "Updating #{visualization.id}"
        begin
          tokens = visualization.get_auth_tokens
          puts "  from #{visualization.auth_token} to #{tokens.first}"
          visualization.update_column(:auth_token, tokens.first)
        rescue StandardError => e
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
        rescue StandardError => e
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
        rescue StandardError => e
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
          rescue StandardError => e
            puts "ERROR adding analyses to mapcap: #{mapcap.id}: #{e.inspect}"
          end
        end
      end
    end

    desc "Restore visualization from backup"
    task :restore_visualization, [:backup_id] => :environment do |_, args|
      include Carto::VisualizationBackupService

      backup_id = args[:backup_id]
      visualization = restore_visualization_backup(backup_id)
      puts "Error restoring visualization" if visualization.nil?
      puts "Visualization #{visualization.id} restored" unless visualization.nil?
    end

    private

    def inconsistent?(viz)
      (viz.table? && viz.related_tables.empty?) || (viz.derived? && viz.map.nil?)
    end

    def inconsistent_table?(viz)
      (viz.user_table.nil? && viz.related_tables.empty?)
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

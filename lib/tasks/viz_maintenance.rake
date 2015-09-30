require_relative "../../app/factories/layer_factory"
require_relative "../../app/factories/map_factory"

namespace :cartodb do
  namespace :vizs do

    desc "Purges broken visualizations due to bug during deletion."
    task :delete_inconsistent, [:username] => :environment do |t, args|
      username = args[:username]
      raise "You should pass a username param" unless username
      user = User[username: username]
      collection = CartoDB::Visualization::Collection.new.fetch(user_id: user.id)

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

      vis_ids = vqb.pluck(:id)
      vis_ids.each do |viz_id|
        begin
          current += 1

          # Sad, but using the Collection causes OOM, so instantiate one by one even if takes a while
          vis = CartoDB::Visualization::Member.new(id: viz_id).fetch
          vis.send(:save_named_map)
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

    desc "Exports/Backups a visualization"
    task :export_user_visualization, [:vis_id] => :environment do |_, args|
      vis_export_service = Carto::VisualizationsExportService.new

      puts "Exporting visualization #{args[:vis_id]}..."
      vis_export_service.export(args[:vis_id])

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

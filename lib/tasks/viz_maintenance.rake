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

    # TODO: this and following task should go in a separate class, but as for initial tests leave here

    desc "Exports visualization metadata to the output"
    task :export_user_visualization, [:vis_id, :export_file] => :environment do |_, args|
      require_relative "../../app/controllers/carto/api/visualization_vizjson_adapter"

      raise "Export destination file '#{args[:export_file]}' already exists" if File.file?(args[:export_file])

      visualization = Carto::Visualization.where(id: args[:vis_id]).first
      raise "Visualization with id #{args[:vis_id]} not found" unless visualization

      vizjson_options = {
        full: true,
        user_name: visualization.user.username,
        user_api_key: visualization.user.api_key,
        user: visualization.user,
        viewer_user: visualization.user,
        export: true
      }

      puts "Exporting visualization #{args[:vis_id]}..."

      data = CartoDB::Visualization::VizJSON.new(
        Carto::Api::VisualizationVizJSONAdapter.new(visualization, $tables_metadata), vizjson_options, Cartodb.config)
                                            .to_export_poro
                                            .to_json

      file = File.open(args[:export_file], "w")
      file.write(data)
      file.close

      puts "Export complete"
    end

    desc "Imports a visualization using a metadata file"
    task :import_user_visualization, [:export_file] => :environment do |_, args|
      raise "Export '#{args[:export_file]}' not found" unless File.file?(args[:export_file])

      puts "Importing visualization data from #{args[:export_file]}"

      dump_data = ::JSON.parse(IO.read(args[:export_file]))

      # TODO: support partial restores
      unless Carto::Visualization.where(id: dump_data["id"]).first.nil?
        raise "Visualization #{dump_data["id"]} already exists"
      end

      user = ::User.where(id: dump_data["owner"]["id"]).first

      # TODO: Import base layer instead of using default one if present
      base_layer = CartoDB::Factories::LayerFactory.get_default_base_layer(user)
      map = CartoDB::Factories::MapFactory.get_map(base_layer, user.id)
      map.add_layer(base_layer)

      dump_data["layers"].select { |layer| layer["type"] == "layergroup" }.each do |layergroup|
        layergroup["options"]["layer_definition"]["layers"].each do |layer|
          # TODO: new factory method to "get_data_layer"
          data_layer = CartoDB::Factories::LayerFactory.get_default_data_layer(layer["options"]["table_name"], user)
          map.add_layer(data_layer)
        end
      end

      dump_data["layers"].select { |layer| ::Layer::DATA_LAYER_KINDS.include?(layer["type"]) }.each do |layer|
        # TODO: new factory method to "get_data_layer"
        data_layer = CartoDB::Factories::LayerFactory.get_default_data_layer(layer["options"]["table_name"], user)
        map.add_layer(data_layer)
      end

      # TODO: Import labels layer instead of using default one if present
      if base_layer.supports_labels_layer?
        labels_layer = CartoDB::Factories::LayerFactory.get_default_labels_layer(base_layer)
        map.add_layer(labels_layer)
      end

      visualization = CartoDB::Visualization::Member.new(
        id: dump_data["id"],
        name: dump_data["title"],
        description: dump_data["description"],
        type: CartoDB::Visualization::Member::TYPE_DERIVED,
        privacy: CartoDB::Visualization::Member::PRIVACY_LINK,
        user_id: dump_data["owner"]["id"],
        map_id: map.id,
        kind: CartoDB::Visualization::Member::KIND_GEOM)

      visualization.store

      puts "Visualization #{visualization.id} imported"
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

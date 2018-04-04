require 'carto/mapcapped_visualization_updater'

namespace :carto do
  namespace :db do
    desc "get modified layers"
    task :get_modified_layers => :environment do
      if ENV['DATE_AFTER'].blank?
        raise "Missing DATE_AFTER var"
      else
        date_after = ENV['DATE_AFTER']
      end
      if ENV['DATE_BEFORE'].blank?
        raise "Missing DATE_BEFORE var"
      else
        date_before = ENV['DATE_BEFORE']
      end

      layers = Layer.where("updated_at BETWEEN timestamp with time zone '#{date_after}' and timestamp with time zone '#{date_before}'").all
      final_layers = layers.select do |l|
        options = JSON.parse(l[:options])
        options["tile_style_custom"] == false && ["category", "bubble", "torque", "choropleth"].include?(options["wizard_properties"]["type"])
      end
      affected_visualizations = []
      final_layers.each do |l|
      end
      affected_visualizations.uniq!
      puts "Affected layers"
      puts "---------------"
      final_layers.each do |l|
        begin
          v = l.maps.first.visualizations.first
          owner = l.maps.first.user
          affected_visualizations << "#{v.id} | #{v.name} | updated: #{v.updated_at} | user: #{owner.username} | type: #{v.type}"
          puts "id: #{l.id} | visualization: #{v.id} | vis_type: #{v.type} | updated_at: #{l.updated_at} | user: #{owner.username}"
        rescue
          puts "Ignoring orphan layer #{l.id}"
        end
      end
      puts "TOTAL: #{final_layers.length}"
      puts ""
      puts "Affected visualizations"
      puts "-----------------------"
      affected_visualizations.each do |v|
        puts v
      end
      puts "TOTAL: #{affected_visualizations.length}"
    end

    desc "CARTO rebranding attribution change"
    task set_carto_attribution: :environment do
      puts "Updating layer attributions"
      ActiveRecord::Base.logger = nil

      total = Carto::Layer.count
      acc = 0
      errors = 0

      Carto::Layer.find_each do |layer|
        acc += 1
        puts "#{acc} / #{total}" if acc % 100 == 0
        begin
          attribution = layer.options['attribution']
          if attribution.present?
            attribution.gsub!('CartoDB', 'CARTO')
            attribution.gsub!('cartodb.com', 'carto.com')
            attribution.gsub!('http://carto', 'https://carto')
            attribution.gsub!(
              'OpenStreetMap</a> contributors &copy; <a href=\"https://carto.com/attributions\">CARTO</a>',
              'OpenStreetMap</a> contributors')
          end
          category = layer.options['category']
          if category.present? && category == 'CartoDB'
            layer.options['category'] = 'CARTO'
          end
          layer.save
        rescue => e
          errors += 1
          STDERR.puts "Error updating layer #{layer.id}: #{e.inspect}. #{e.backtrace.join(',')}"
        end
      end

      puts "Finished. Total: #{total}. Errors: #{errors}"
    end

    desc "Nokia -> HERE layer update (platform #2815)"
    task update_nokia_layers: :environment do
      include Carto::MapcappedVisualizationUpdater

      basemaps = Cartodb.get_config(:basemaps, 'Here')

      puts "Updating base layer urls"
      layer_dataset = Carto::Layer.where(kind: 'tiled')
                                  .where("options LIKE '{%' AND options::json->>'className' IN (?)", basemaps.keys)
      total = layer_dataset.count
      acc = 0
      errors = 0

      puts "Updating #{total} layers"
      layer_dataset.find_each do |layer|
        acc += 1
        puts "#{acc} / #{total}" if (acc % 100).zero?
        begin
          visualization = layer.visualization
          next unless visualization

          success = update_visualization_and_mapcap(visualization) do |vis, persisted|
            vis.user_layers.each do |l|
              layer_class = l.options[:className]
              if basemaps.keys.include?(layer_class)
                l.options[:urlTemplate] = basemaps[layer_class.to_s]['url']
                l.options[:name] = basemaps[layer_class.to_s]['name']
                l.save if persisted
              end
            end
          end

          raise 'MapcappedVisualizationUpdater returned false' unless success
        rescue => e
          errors += 1
          STDERR.puts "Error updating layer #{layer.id}: #{e.inspect}. #{e.backtrace.join(',')}"
        end
      end

      puts "Finished. Total: #{total}. Errors: #{errors}"
    end

    module LayersRake
      def self.update_layer(layer, options, persisted)
        layer.options = options
        layer.user.viewer = false # To avoid validation issues
        layer.save! if persisted
      end
    end

    desc "Syncs all layers with the configuration from app_config"
    task sync_basemaps_from_app_config: :environment do
      include Carto::MapcappedVisualizationUpdater

      basemaps = Cartodb.get_config(:basemaps)

      basemaps_by_class_name = basemaps.flat_map { |category, classes|
        if category != 'GMaps'
          classes.map { |_, attributes|
            class_name = attributes['className']
            [class_name, attributes] if class_name.present?
          }.compact
        else
          []
        end
      }.compact.to_h

      puts "Updating base layer urls"
      viz_dataset = Carto::Visualization.where(type: ['table', 'derived'])
      total = viz_dataset.count
      acc = 0
      updated = 0
      errors = 0

      puts "Updating #{total} visualizations"
      viz_dataset.eager_load(map: :layers).eager_load(:user).find_each do |visualization|
        acc += 1
        puts "#{acc} / #{total}" if (acc % 100).zero?
        next unless visualization.user
        begin
          success = update_visualization_and_mapcap(visualization) do |vis, persisted|
            # Find visualization tiled base layers
            base_layers = vis.layers.select(&:tiled?)
            next true unless base_layers.count.between?(1, 2) # Other kind of basemaps (e.g: plain color), skip
            bottom_layer, labels_layer = base_layers.sort_by(&:order)

            # Find basemap in configuration
            class_name = bottom_layer.options['className']
            attributes = basemaps_by_class_name[class_name]
            next true unless attributes # Unknown basemap class: do nothing (e.g: custom basemap)

            # Update bottom layer
            LayersRake.update_layer(bottom_layer, attributes.except('default'), persisted)

            # Update top layer (if present)
            if labels_layer && attributes['labels']
              default_labels_layer = Carto::LayerFactory.build_default_labels_layer(bottom_layer)
              LayersRake.update_layer(labels_layer, default_labels_layer.options, persisted)
            elsif labels_layer
              STDERR.puts "WARN: Visualization #{vis.id} has label but basemap class #{class_name} does not"
            elsif attributes['labels']
              STDERR.puts "WARN: Basemap class #{class_name} has label but visualization #{vis.id} does not"
            end

            updated += 1

            true
          end

          raise 'MapcappedVisualizationUpdater returned false' unless success
        rescue StandardError => e
          errors += 1
          STDERR.puts "Error updating visualization #{visualization.id}: #{e.inspect}. #{e.backtrace.join(',')}"
        end
      end

      puts "Finished. Total: #{total}. Updated: #{updated}. Errors: #{errors}"
    end
  end
end

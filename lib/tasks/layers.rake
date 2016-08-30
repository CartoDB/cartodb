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
  end
end

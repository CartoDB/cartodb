namespace :cartodb do
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
  end
end


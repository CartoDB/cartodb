# encoding: utf-8


namespace :cartodb do
  namespace :overlays do

    desc 'removes duplicated overlays from visualizations'
    task :remove_duplicate_overlays => :environment do |t, args|
      count = 0
      unique_types = Carto::Overlay::UNIQUE_TYPES
      Carto::Visualization.find_each do |vis|
        if vis.user
          begin
            overlays_counts = {}
            if !vis.overlays.nil? && vis.overlays.count > 0
              vis.overlays.each { |overlay|
                if !overlays_counts[overlay.type].present?
                  overlays_counts[overlay.type] = 1
                else
                  if unique_types.include?(overlay.type)
                    puts "Found duplicate for #{vis.id} of type '#{overlay.type}'"
                    overlay.delete
                  else
                    overlays_counts[overlay.type]+=1
                  end
                end
              }
            end
            if count % 500 == 0
              puts "Progress: #{count}"
            end
            count+=1
          rescue => e
            puts "ERROR: failed to remove duplicate overlays for #{vis.id}: #{e.message}"
          end
        end
      end
    end
  end
end

# encoding: utf-8


namespace :cartodb do
  namespace :overlays do

    desc 'removes duplicated overlays from visualizations'
    task :remove_duplicate_overlays => :environment do |t, args|
      count = 0
      unique_types = Carto::Overlay::UNIQUE_TYPES
      CartoDB::Visualization::Collection.new.fetch({ per_page: 999999 }).each { |vis|
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
      }
    end

    desc 'create overlays from url_options'
    task :create_overlays, [:clear_overlays] => :environment do |t, args|
      ok = 0
      failed = 0
      count = 0
      CartoDB::Visualization::Collection.new.fetch({ type: CartoDB::Visualization::Member::TYPE_CANONICAL, per_page: 999999 }).each { |vis|
          if vis.user
            begin
              if args[:clear_overlays]
                vis.overlays.each { |o| o.delete }
              end
              # Do not recreate if already has
              if vis.overlays.nil? || vis.overlays.count == 0
                CartoDB::Visualization::Overlays.new(vis).create_legacy_overlays
              end
              if count % 500 == 0
                puts "Progress: #{count}"
              end
              count+=1
            rescue => e
              puts "ERROR: failed to create overlays for #{vis.id}: #{e.message}"
              failed+=1
            end
            ok+=1
          else
            failed+=1
            puts "WARNING: visualization #{vis.id} without user"
          end
      }

      CartoDB::Visualization::Collection.new.fetch({ type: CartoDB::Visualization::Member::TYPE_DERIVED, per_page: 999999 }).each { |vis|
          if vis.user
            begin
              if args[:clear_overlays]
                vis.overlays.each { |o| o.delete }
              end
              # Do not recreate if already has
              if vis.overlays.nil? || vis.overlays.count == 0
                CartoDB::Visualization::Overlays.new(vis).create_legacy_overlays
              end
              if count % 500 == 0
                puts "Progress: #{count}"
              end
              count+=1
            rescue => e
              puts "ERROR: failed to create overlays for #{vis.id}: #{e.message}"
              failed+=1
            end
            ok+=1
          else
            puts "WARNING: visualization #{vis.id} without user"
            failed+=1
          end
      }
      total = ok + failed
      puts "TOTAL: #{total}, FAILED: #{failed}"
    end

  end
end

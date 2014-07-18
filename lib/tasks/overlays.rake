# encoding: utf-8


namespace :cartodb do
  namespace :overlays do

    desc 'create overlays from url_options'
    task :create_overlays => :environment do
      ok = 0
      failed = 0
      CartoDB::Visualization::Collection.new.fetch({ type: CartoDB::Visualization::Member::CANONICAL_TYPE }).each { |vis|
          if vis.user
            begin
              CartoDB::Visualization::Overlays.new(vis).create_default_overlays
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

      CartoDB::Visualization::Collection.new.fetch({ type: CartoDB::Visualization::Member::DERIVED_TYPE }).each { |vis|
          if vis.user
            begin
              CartoDB::Visualization::Overlays.new(vis).create_overlays_from_url_options(vis.url_options)
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

# encoding: utf-8


namespace :cartodb do
  namespace :overlays do

    desc 'create overlays from url_options'
    task :create_overlays, [:clear_overlays] => :environment do |t, args|
      ok = 0
      failed = 0
      CartoDB::Visualization::Collection.new.fetch({ type: CartoDB::Visualization::Member::CANONICAL_TYPE, per_page: 999999 }).each { |vis|
          if vis.user
            begin
              if args[:clear_overlays]
                vis.overlays.each { |o| o.delete }
              end
              CartoDB::Visualization::Overlays.new(vis).create_legacy_overlays
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

      CartoDB::Visualization::Collection.new.fetch({ type: CartoDB::Visualization::Member::DERIVED_TYPE, per_page: 999999 }).each { |vis|
          if vis.user
            begin
              if args[:clear_overlays]
                vis.overlays.each { |o| o.delete }
              end
              CartoDB::Visualization::Overlays.new(vis).create_legacy_overlays
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

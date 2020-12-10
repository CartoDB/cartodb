namespace :cartodb do
  namespace :users do
    desc 'Get map views from remote service for every user'
    task :update_remote_map_views => :environment do
      puts "Updating local map views cache for every user..."
      ::User.all.each do |u|
        print "  - Update #{u.username}"
        u.set_old_api_calls # updates map views stats older than 3 hours
        print " OK\n"
      end
    end
  end

  namespace :mapviews do
    desc 'Get the sum of all the torque mapviews'
    task :torque_total => :environment do
      total_torque_mapviews = 0
      total_visualizations = 0
      offset = 0
      stats_manager = CartoDB::Stats::APICalls.new
      while (torque_vis = SequelRails.connection.fetch(get_torque_visualization(offset, 1000)).all).length > 0
        torque_vis.each do |vis|
          total_visualizations += 1
          total_torque_mapviews += get_total_vis_mapviews(vis, stats_manager)
        end
        offset += torque_vis.length
      end
      puts "Total torque mapviews: #{total_torque_mapviews}"
      puts "Total visualizations with torque layers: #{total_visualizations}"
    end

    def get_torque_visualization(offset, pagesize)
      %[SELECT v.id, u.username FROM visualizations v
        INNER JOIN users u ON v.user_id = u.id
        INNER JOIN layers_maps lm ON v.map_id = lm.map_id
        INNER JOIN layers l ON lm.layer_id = l.id
        WHERE l.kind = 'torque'
        LIMIT #{pagesize} OFFSET #{offset}]
    end

    def get_total_vis_mapviews(visualization, stats_manager)
        stats_manager.get_total_api_calls_from_redis(visualization[:username], visualization[:id])
    end
  end
end

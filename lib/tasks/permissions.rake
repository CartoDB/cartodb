namespace :cartodb do
  namespace :permissions do
    desc 'setup default permissions for visualizations without them'
    task fill_missing_permissions: :environment do
      # This uses the new models to avoid triggering side-effects
      viz = Carto::Visualization.select('visualizations.*')
                                .joins('LEFT JOIN permissions ON visualizations.permission_id = permissions.id')
                                .where('permissions.id IS NULL OR permissions.entity_id != visualizations.id')
      puts "*** Updating permissions for #{viz.count} visualization"
      sleep 2
      failed_ids = []
      viz.each do |v|
        begin
          puts '*** Updating permissions for visualization ' + v.id
          # Tries to find existing permission
          perms = Carto::Permission.where(entity_id: v.id).all
          if perms.count == 0
            puts '  - Creating new default permission'
            perm = Carto::Permission.create(
              owner_id:       v.user.id,
              owner_username: v.user.username,
              entity_id:      v.id,
              entity_type:    'vis'
            )
            v.permission_id = perm.id
            v.save
          elsif perms.count == 1
            puts '  - Reusing existing permission'
            v.permission_id = perms.first.id
            v.save
          else
            puts '  - Multiple permissions, skipping'
            failed_ids << v.id
          end
          sleep 0.2
        rescue => e
          puts 'ERROR ' + e.message
          puts e.backtrace.join("\n")
          failed_ids << v.id
        end
      end
      unless failed_ids.empty?
        puts '*** Failed visualizations:'
        puts failed_ids.join('\n')
      end
    end
  end
end

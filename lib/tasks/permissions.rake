namespace :cartodb do
  namespace :permissions do
    desc 'setup default permissions for visualizations without them'
    task fill_missing_permissions: :environment do
      # This uses the new models to avoid triggering side-effects
      viz = Carto::Visualization.select('visualizations.*')
                                .joins('LEFT JOIN permissions ON visualizations.permission_id = permissions.id')
                                .where(permissions: { id: nil })
      puts "*** Updating permissions for #{viz.count} visualization"
      sleep 2
      viz.each do |v|
        begin
          puts '*** Updating permissions for visualization ' + v.id
          perm = Carto::Permission.create(
            owner_id:       v.user.id,
            owner_username: v.user.username,
            entity_id:      v.id,
            entity_type:    'vis'
          )
          v.permission_id = perm.id
          v.save
          sleep 0.2
        rescue => e
          puts 'ERROR ' + e.message
          puts e.backtrace.join("\n")
        end
      end
    end
  end
end

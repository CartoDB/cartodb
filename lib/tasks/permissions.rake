namespace :cartodb do
  namespace :permissions do
    desc 'setup default permissions for visualizations without them'
    task :fill_missing_permissions, [:auto_fix] => :environment do |_, args|
      File.open('log/fill_missing_permissions.log', 'a') do |log_file|
        auto_fix = args[:auto_fix].present?

        # This uses the new models to avoid triggering side-effects
        viz = Carto::Visualization.select('visualizations.*')
                                  .joins('LEFT JOIN permissions ON visualizations.permission_id = permissions.id')
                                  .where('permissions.id IS NULL OR permissions.entity_id != visualizations.id').all
        puts "*** Updating permissions for #{viz.count} visualization"
        puts "*** Automatically fixing conflicts" if auto_fix
        sleep 5
        failed_ids = []

        viz.each do |v|
          begin
            puts '*** Updating permissions for visualization ' + v.id
            # Tries to find existing permission
            perms = Carto::Permission.where(entity_id: v.id).all
            if perms.empty?
              puts '  - Creating new default permission'

              user_id = v.user_id ? v.user_id : '00000000-0000-0000-0000-000000000000'
              username = v.user ? v.user.username : 'cdb_unknown' # Workaround for invalid users
              perm = Carto::Permission.create(
                owner_id:       user_id,
                owner_username: username
              )

              log_file.puts "Visualization #{v.id}, permission changed from '#{v.permission_id}' to '#{perm.id}' (default)"
              v.update_column(:permission_id, perm.id)
            elsif perms.count == 1 || auto_fix
              puts '  - Reusing existing permission'
              log_file.puts "Visualization #{v.id}, permission changed from '#{v.permission_id}' to '#{perms.first.id}'"
              v.update_column(:permission_id, perms.first.id)
            else
              puts '  - Multiple permissions, skipping'
              failed_ids << v.id
            end
            sleep 0.2
          rescue StandardError => e
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

    desc 'fix permission pointing to non-existing entities'
    task :fix_permission_acl => :environment do
      permission_query = Carto::Permission.where("access_control_list != '[]'")

      # Load the full list of user and group ids into memory for performance
      uids = Set.new(Carto::User.select(:id).map(&:id))
      gids = Set.new(Carto::Group.select(:id).map(&:id))

      total = permission_query.count
      i = 0
      permission_query.find_each do |p|
        begin
          new_acl = p.acl.reject do |acl|
            acl[:type] == 'user' && !uids.include?(acl[:id]) ||
              acl[:type] == 'group' && !gids.include?(acl[:id])
          end

          if new_acl != p.acl
            puts "Fixing #{p.id}. From #{p.acl} to #{new_acl}"
            p.update_column(:access_control_list, JSON.dump(new_acl))
            p.save!
          end

          i += 1
          puts "#{i} / #{total}" if (i % 100).zero?
        rescue StandardError => e
          puts "Unable to update Permission: #{e}"
        end
      end
    end
  end
end

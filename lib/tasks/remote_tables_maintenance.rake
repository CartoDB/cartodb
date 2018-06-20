require 'date'
require_relative '../../app/services/carto/data_library_service'
require_relative '../../lib/carto_api/json_client'

namespace :cartodb do

  namespace :remotes do

    task :clear, [:username] => [:environment] do |t, args|
      username = args[:username]
      raise 'username required' unless username.present?

      u = ::User.where(username: username).first
      require_relative '../../app/services/visualization/common_data_service'
      deleted = CartoDB::Visualization::CommonDataService.new.delete_common_data_for_user(u)
      puts "Deleted #{deleted} remote visualizations"
    end

    task :clear_org, [:org_name] => [:environment] do |t, args|
      org_name = args[:org_name]
      raise 'organization name required' unless org_name.present?

      require_relative '../../app/services/visualization/common_data_service'
      common_data_service = CartoDB::Visualization::CommonDataService.new
      o = Organization.where(name: org_name).first
      o.users.each { |u|
        common_data_service.delete_common_data_for_user(u)
      }
    end

    desc 'Load common data account remotes. Pass username as first argument. Example: `rake cartodb:remotes:reload[development]`'
    task :reload, [:username] => [:environment] do |t, args|
      username = args[:username]
      raise 'username required' unless username.present?

      u = ::User.where(username: username).first
      require_relative '../../app/services/visualization/common_data_service'
      vis_api_url = get_visualizations_api_url
      CartoDB::Visualization::CommonDataService.new.load_common_data_for_user(u, vis_api_url)
    end

    desc 'Load common data account remotes for a whole organization. Pass organization name as first argument. Example: `rake cartodb:remotes:reload[my_team]`'
    task :reload_org, [:org_name] => [:environment] do |t, args|
      org_name = args[:org_name]
      raise 'organization name required' unless org_name.present?

      require_relative '../../app/services/visualization/common_data_service'
      common_data_service = CartoDB::Visualization::CommonDataService.new
      vis_api_url = get_visualizations_api_url
      o = Organization.where(name: org_name).first
      o.users.each {|u|
        common_data_service.load_common_data_for_user(u, vis_api_url)
      }
    end

    desc 'Load common data account remotes for multiple users, in alphabetical order. If you pass a username, it will do it beginning in the next username'
    task :load_all, [:from_username] => [:environment] do |t, args|
      require_relative '../../app/services/visualization/common_data_service'
      common_data_service = CartoDB::Visualization::CommonDataService.new
      vis_api_url = get_visualizations_api_url
      puts DateTime.now
      # TODO: batch
      users = ::User.order_by(:username)
      users = users.where("username > '#{args[:from_username]}'") unless args[:from_username].nil?
      users.all.each do |user|
        added, updated, not_modified, removed, failed = common_data_service.load_common_data_for_user(user, vis_api_url)
        printf("%20s: +%03d; *%03d; =%03d; -%03d; e%03d\n", user.username, added, updated, not_modified, removed, failed)
      end
      puts DateTime.now
    end

    load_in_data_library_from_api_key_args = [:scheme, :base_domain, :port, :source_username,
                                              :source_api_key, :target_username, :granted_api_key]
    # Example: rake cartodb:remotes:load_in_data_library_from_api_key[https,carto.com,80,s_user,s_user_key,t_user,g_key]
    desc 'Loads all datasets for a API key in a Data Library. `granted_api_key` will be stored for importing.'
    task :load_in_data_library_from_api_key, load_in_data_library_from_api_key_args => [:environment] do |_, args|
      raise "All arguments are mandatory" unless load_in_data_library_from_api_key_args.all? { |a| args[a].present? }

      client = CartoAPI::JsonClient.new(
        scheme: args['scheme'], base_domain: args['base_domain'], port: args['port'].to_i
      )
      service = Carto::DataLibraryService.new
      service.load_datasets!(client,
                             source_username: args['source_username'], source_api_key: args['source_api_key'],
                             target_username: args['target_username'], granted_api_key: args['granted_api_key'])
    end

    load_in_data_library_args = load_in_data_library_from_api_key_args + ['source_dataset']
    # Example: rake cartodb:remotes:load_in_data_library[https,carto.com,80,s_data,s_user,s_user_key,t_user,g_key]
    desc 'Loads a dataset in a Data Library. `granted_api_key` is the key that will be stored for importing.'
    task :load_in_data_library, load_in_data_library_args => [:environment] do |_, args|
      raise "All arguments are mandatory" unless load_in_data_library_args.all? { |a| args[a].present? }

      client = CartoAPI::JsonClient.new(
        scheme: args['scheme'], base_domain: args['base_domain'], port: args['port'].to_i
      )
      service = Carto::DataLibraryService.new
      service.load_dataset!(client,
                            source_dataset: args['source_dataset'], source_username: args['source_username'],
                            source_api_key: args['source_api_key'],
                            target_username: args['target_username'], granted_api_key: args['granted_api_key'])
    end

    desc 'Removes a Data Library entry from a user'
    task :remove_from_data_library, [:username, :visualization_name] => [:environment] do |_, args|
      username = args['username']
      name = args['visualization_name']
      raise 'All Arguments are mandatory' unless username.present? && name.present?

      user = Carto::User.find_by_username(username)
      raise 'User not found' unless user

      visualization = user.visualizations.remotes.find_by_name(name)
      raise 'Visualization not found' unless visualization

      visualization.destroy
    end

    desc "Invalidate user's date flag and make them refresh data library"
    task :invalidate_common_data => [:environment] do
      require_relative '../../app/helpers/common_data_redis_cache'
      require_relative '../../app/services/visualization/common_data_service'

      invalidate_sql = %Q[
          UPDATE users
          SET last_common_data_update_date = null
          WHERE last_common_data_update_date >= now() - '#{::User::COMMON_DATA_ACTIVE_DAYS} day'::interval;
        ]
      updated_rows = SequelRails.connection.fetch(invalidate_sql).update
      CommonDataRedisCache.new.invalidate
      puts "#{updated_rows} users invalidated"

      # Now we try to add the new common-data request to the cache using the common_data user
      common_data_user = ::User.where(username: Cartodb.config[:common_data]["username"]).first
      if !common_data_user.nil?
        vis_api_url = get_visualizations_api_url
        CartoDB::Visualization::CommonDataService.new.load_common_data_for_user(common_data_user, vis_api_url)
      end
    end

    def get_visualizations_api_url
      common_data_config = Cartodb.config[:common_data]
      username = common_data_config["username"]
      base_url = common_data_config["base_url"].nil? ? CartoDB.base_url(username) : common_data_config["base_url"]
      base_url + "/api/v1/viz?type=table&privacy=public"
    end

    module RemoteTablesMaintenanceRake
      def self.delete_remote_visualizations(user)
        user.update_column(:last_common_data_update_date, nil)

        user.visualizations.where(type: 'remote').each do |v|
          begin
            unless v.external_source
              puts "  Remote visualization #{v.id} does not have a external source. Skipping..."
              next
            end
            if v.external_source.external_data_imports.any?
              puts "  Remote visualization #{v.id} has been previously imported. Skipping..."
              next
            end

            v.external_source.delete
            v.delete
          rescue => e
            puts "  Error deleting visualization #{v.id}: #{e.message}"
          end
        end
      end
    end

    # Removes common data visualizations from users which have not seen activity in some time
    # e.g: rake cartodb:remotes:remove_from_inactive_users[365,90] will affect all users
    # whose last activity was between 1 year and 3 months ago
    desc 'Remove common data visualizations from inactive users'
    task :remove_from_inactive_users, [:start_days_ago, :end_days_ago] => :environment do |_t, args|
      start_days_ago = args[:start_days_ago].try(:to_i) || 365 * 2
      end_days_ago = args[:end_days_ago].try(:to_i) || 30 * 3
      raise 'Invalid date interval' unless start_days_ago > end_days_ago && end_days_ago > 0
      start_date = DateTime.now - start_days_ago
      end_date = DateTime.now - end_days_ago

      puts "Removing common data visualizations for users with last activity between #{start_date} and #{end_date}"
      query = Carto::User.where("COALESCE(dashboard_viewed_at, created_at) BETWEEN '#{start_date}' AND '#{end_date}'")
                         .where(account_type: 'FREE')
      user_count = query.count
      puts "#{user_count} users will be affected. Starting in 10 seconds unless canceled (ctrl+C)"
      sleep 10

      processed = 0
      query.find_each do |user|
        processed += 1
        puts "#{user.username} (#{processed} / #{user_count})"
        RemoteTablesMaintenanceRake.delete_remote_visualizations(user)
      end
    end

    # Removes common data visualizations from a specific user
    desc 'Remove common data visualizations from user'
    task :remove_from_user, [:username] => :environment do |_t, args|
      RemoteTablesMaintenanceRake.delete_remote_visualizations(Carto::User.find_by_username(args[:username]))
    end

    # Removes common data visualizations from a specific organization
    desc 'Remove common data visualizations from user'
    task :remove_from_organization, [:orgname] => :environment do |_t, args|
      query = Carto::User.where(organization_id: Carto::Organization.find_by_name(args[:orgname]).id)
      user_count = query.count
      puts "#{user_count} users will be affected."

      processed = 0
      query.find_each do |user|
        processed += 1
        puts "#{user.username} (#{processed} / #{user_count})"
        RemoteTablesMaintenanceRake.delete_remote_visualizations(user)
      end
    end
  end

end

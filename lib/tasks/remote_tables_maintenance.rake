require 'date'

namespace :cartodb do

  namespace :remotes do

    task :clear, [:username] => [:environment] do |t, args|
      username = args[:username]
      raise 'username required' unless username.present?

      u = User.where(username: username).first
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

      u = User.where(username: username).first
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
      users = User.order_by(:username)
      users = users.where("username > '#{args[:from_username]}'") unless args[:from_username].nil?
      users.all.each do |user|
        added, updated, not_modified, removed, failed = common_data_service.load_common_data_for_user(user, vis_api_url)
        printf("%20s: +%03d; *%03d; =%03d; -%03d; e%03d\n", user.username, added, updated, not_modified, removed, failed)
      end
      puts DateTime.now
    end

    desc "Invalidate user's date flag and make them refresh data library"
    task :invalidate_common_data => [:environment] do
      require_relative '../../app/helpers/common_data_redis_cache'
      require_relative '../../app/services/visualization/common_data_service'

      invalidate_sql = %Q[
          UPDATE users
          SET last_common_data_update_date = null
          WHERE last_common_data_update_date >= now() - '#{User::COMMON_DATA_ACTIVE_DAYS} day'::interval;
        ]
      updated_rows = Rails::Sequel.connection.fetch(invalidate_sql).update
      CommonDataRedisCache.new.invalidate
      puts "#{updated_rows} users invalidated"

      # Now we try to add the new common-data request to the cache using the common_data user
      common_data_user = User.where(username: Cartodb.config[:common_data]["username"]).first
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

  end

end

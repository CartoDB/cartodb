require 'date'

namespace :cartodb do

  namespace :remotes do

    task :clear, [:username] => [:environment] do |t, args|
      username = args[:username]
      raise 'username required' unless username.present?

      u = User.where(username: username).first
      require_relative '../../app/services/visualization/common_data_service'
      vis_api_url = generate_vis_api_url
      CartoDB::Visualization::CommonDataService.new(vis_api_url).delete_common_data_for_user(u)
    end

    task :clear_org, [:org_name] => [:environment] do |t, args|
      org_name = args[:org_name]
      raise 'organization name required' unless org_name.present?

      require_relative '../../app/services/visualization/common_data_service'
      vis_api_url = generate_vis_api_url
      common_data_service = CartoDB::Visualization::CommonDataService.new(vis_api_url)
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
      vis_api_url = generate_vis_api_url
      CartoDB::Visualization::CommonDataService.new(vis_api_url).load_common_data_for_user(u)
    end

    desc 'Load common data account remotes for a whole organization. Pass organization name as first argument. Example: `rake cartodb:remotes:reload[my_team]`'
    task :reload_org, [:org_name] => [:environment] do |t, args|
      org_name = args[:org_name]
      raise 'organization name required' unless org_name.present?

      require_relative '../../app/services/visualization/common_data_service'
      vis_api_url = generate_vis_api_url
      common_data_service = CartoDB::Visualization::CommonDataService.new(vis_api_url)
      o = Organization.where(name: org_name).first
      o.users.each {|u|
        common_data_service.load_common_data_for_user(u)
      }
    end

    desc 'Load common data account remotes for multiple users, in alphabetical order. If you pass a username, it will do it beginning in the next username'
    task :load_all, [:from_username] => [:environment] do |t, args|
      require_relative '../../app/services/visualization/common_data_service'
      vis_api_url = generate_vis_api_url
      common_data_service = CartoDB::Visualization::CommonDataService.new(vis_api_url)
      puts DateTime.now
      # TODO: batch
      users = User.order_by(:username)
      users = users.where("username > '#{args[:from_username]}'") unless args[:from_username].nil?
      users.all.each do |user|
        added, updated, not_modified, removed, failed = common_data_service.load_common_data_for_user(user)
        printf("%20s: +%03d; *%03d; =%03d; -%03d; e%03d\n", user.username, added, updated, not_modified, removed, failed)
      end
      puts DateTime.now
    end

    def generate_vis_api_url
      username = Cartodb.config[:common_data]["username"]
      CartoDB.base_url(username) + "/api/v1/viz?type=table&privacy=public"
    end

  end

end

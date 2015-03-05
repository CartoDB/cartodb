require 'date'
require_relative '../../app/models/common_data'

namespace :cartodb do

  namespace :remotes do

    task :clear, [:username] => [:environment] do |t, args|
      username = args[:username]
      raise 'username required' unless username.present?

      u = User.where(username: username).first

      u.delete_common_data
    end

    task :clear_org, [:org_name] => [:environment] do |t, args|
      org_name = args[:org_name]
      raise 'organization name required' unless org_name.present?

      o = Organization.where(name: org_name).first
      o.users.each { |u|
        u.delete_common_data
      }
    end

    desc 'Load common data account remotes. Pass username as first argument. Example: `rake cartodb:remotes:reload[development]`'
    task :reload, [:username] => [:environment, :clear] do |t, args|
      username = args[:username]
      raise 'username required' unless username.present?

      u = User.where(username: username).first
      u.load_common_data
    end

    desc 'Load common data account remotes for a whole organization. Pass organization name as first argument. Example: `rake cartodb:remotes:reload[my_team]`'
    task :reload_org, [:org_name] => [:environment, :clear_org] do |t, args|
      org_name = args[:org_name]
      raise 'organization name required' unless org_name.present?

      datasets = CommonDataSingleton.instance.datasets[:datasets]
      o = Organization.where(name: org_name).first
      o.users.each {|u|
        u.load_common_data(datasets)
      }
    end

    desc 'Load common data account remotes for everybody'
    task :load_all => [:environment] do |t|
      datasets = CommonDataSingleton.instance.datasets[:datasets]
      puts DateTime.now
      User.all.each do |user|
        added, updated, not_modified, failed = user.load_common_data(datasets)
        printf("%20s: +%03d; *%03d; =%03d; e%03d\n", user.username, added, updated, not_modified, failed)
      end
      puts DateTime.now
    end

  end

end

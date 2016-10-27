# encoding: utf-8

# One-time fix tasks
namespace :carto do
  namespace :fix do
    desc "Fix zeroed mapzen quotas for organizations"
    task :zero_mapzen_quota_orgs => :environment do
      deploy_time_utc = '2016-10-20 15:32:00'
      num_orgs = ::Organization.where("updated_at >= '#{deploy_time_utc}' AND mapzen_routing_quota IS NULL").count
      num_org = 0
      puts "Fixing #{num_orgs} organizations"
      ::Organization.where("updated_at >= '#{deploy_time_utc}' AND mapzen_routing_quota IS NULL").each do |org|
        num_org += 1
        puts "  fix #{org.name} #{num_org}/#{num_orgs}"
        org.save_metadata
      end
    end

    desc "Fix zeroed mapzen quotas for users"
    task :zero_mapzen_quota_users => :environment do
      deploy_time_utc = '2016-10-20 15:32:00'
      num_users = ::User.where("updated_at >= '#{deploy_time_utc}' AND mapzen_routing_quota IS NULL").count
      num_user = 0
      puts "Fixing #{num_users} users"
      ::User.where("updated_at >= '#{deploy_time_utc}' AND mapzen_routing_quota IS NULL").use_cursor.each do |user|
        num_user += 1
        puts "  fix #{user.username} #{num_user}/#{num_users}"
        user.save_metadata
      end
    end
  end
end

# encoding: utf-8
namespace :geocoder do
  namespace :metrics do
    # e.g. bundle exec rake geocoder:metrics:check_legacy_with_new_system
    #      bundle exec rake geocoder:metrics:check_legacy_with_new_system[20]
    desc 'Compare the geocoding quota for the current billing cycle between the legacy and the new system'
    task :check_legacy_with_new_system, [:quota_delta] => :environment do |t, args|
      args.with_defaults(:quota_delta => 20)
      begin
        quota_delta_percentage = Float(args[:quota_delta]) / 100
      rescue
        raise "Quota value passed is not an integer"
      end
      users = ::User.overquota(quota_delta_percentage)
      puts "There is no overquota users for today" if users.blank?
      users.each do |user|
        legacy_quota_value = user.get_geocoding_calls
        new_system_quota_value = user.get_new_system_geocoding_calls
        if legacy_quota_value != new_system_quota_value
          puts "User #{user.username} has different values between LEGACY (#{legacy_quota_value}) " \
               "and NEW (#{new_system_quota_value}) metrics systems"
        else
          puts "User #{user.username} OK => LEGACY (#{legacy_quota_value}) " \
               "and NEW (#{new_system_quota_value})"
        end
      end
    end
  end
end

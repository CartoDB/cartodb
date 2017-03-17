namespace :cartodb do
  namespace :user_overquota do
    # e.g. bundle exec rake cartodb:user_overquota:calculate
    #      bundle exec rake cartodb:user_overquota:calculate[0.20]
    desc 'Calculate and store the daily users with overquota greater than some delta'
    task :calculate, [:delta] => :environment do |_task, args|
      args.with_defaults(delta: 0.20)
      delta = args[:delta].to_f
      puts 'Executing overquota calculation'
      Carto::OverquotaUsersService.new.store_overquota_users(delta)
      puts "Ended getting the overquota users for delta #{delta}"
    end
  end
end

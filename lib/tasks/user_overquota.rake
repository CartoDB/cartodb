namespace :cartodb do
  namespace :user_overquota do
      desc 'Calculate and store the daily users with overquota greater than some delta'
      task :calculate, [:delta] => :environment do |_task, args|
        args.with_defaults(delta: 0.20)
        delta = args[:delta].to_f
        puts 'Executing overquota calculation'
        ::User.store_overquota_users(delta, Date.today)
        puts "Ended getting the overquota users for delta #{delta}"
      end
    end
end

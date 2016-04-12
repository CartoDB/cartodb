namespace :cartodb do
  namespace :user_overquota do
    # e.g. bundle exec rake cartodb:user_overquota:calculate
    #      bundle exec rake cartodb:user_overquota:calculate[0.20]
    desc 'Calculate and store the daily users with overquota greater than some delta'
    task :calculate, [:delta] => :environment do |_task, args|
      args.with_defaults(delta: 0.20)
      delta = args[:delta].to_f
      puts 'Executing overquota calculation'
      ::User.store_overquota_users(delta, Date.today)
      puts "Ended getting the overquota users for delta #{delta}"
    end

    # e.g. bundle exec rake cartodb:generate_overquota_report[10]
    #      bundle exec rake cartodb:generate_overquota_report[10, '', 'username']
    #      bundle exec rake cartodb:generate_overquota_report[10, 'FREE']
    desc 'Generates CSV file with geocodings for the user or all the users in X billing cycles'
    task :generate_geocodings_csv, [:number_of_cycles, :account_type, :user, :redis, :filepath] => :environment do |t, args|
      args.with_defaults(:account_type => nil, :user => nil, :redis => true, :filepath => '/tmp/overquota_report.csv')
      filename = args[:filepath]
      number_cycles = args[:number_of_cycles].to_i
      not_checked_accounts = ['ORGANIZATION USER']
      if !args[:user].blank?
        users = ::User.where(username: args[:user]).first
      elsif !args[:account_type].blank?
        users = ::User.where(account_type: args[:account_type]).all
      else
        users = ::User.where("account_type not in ?", not_checked_accounts).all
      end
      write_to_csv(filename, [['user_id', 'username', 'date_from', 'date_to', 'geocoding_quota', 'geocodings']])
      users.each do |user|
        billing_date = user.last_billing_cycle
        output = []
        number_cycles.times do |cycle|
          date_from = billing_date << cycle
          date_to = billing_date << (cycle-1)
          if args[:redis]
            geocodings = user.get_new_system_geocoding_calls(from: date_from, to: date_to)
          else
            geocodings = user.get_db_system_geocoding_calls(date_from, date_to)
          end
          # We don't want cycles with 0 geocoding calls
          next unless geocodings > 0
          quota = user.geocoding_quota
          output << [user.id, user.username, date_from, date_to, quota, geocodings]
        end
        write_to_csv(filename, output)
      end
    end
    def write_to_csv(filename, lines)
      CSV.open(filename, "ab") do |csv|
        lines.each do |line|
          csv << line
        end
      end
    end
  end
end

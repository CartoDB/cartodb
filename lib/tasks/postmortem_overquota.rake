# coding: UTF-8
require 'csv'

namespace :cartodb do
  # e.g. bundle exec rake cartodb:generate_overquota_report[10]
  #      bundle exec rake cartodb:generate_overquota_report[10, 'username']
  #      bundle exec rake cartodb:generate_overquota_report[10, 'username', '/tmp/dummy.csv']
  desc 'Generates CSV report with over quota charges for all users between two months'
  task :generate_overquota_report, [:number_of_cycles, :user, :filepath] => :environment do |t, args|
    args.with_defaults(:user => nil, :filepath => '/tmp/overquota_report.csv')
    filename = args[:filepath]
    number_cycles = args[:number_of_cycles].to_i
    not_checked_accounts = ['ORGANIZATION USER']
    if args[:user]
      users = ::User.where(username: args[:user]).first
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
        geocodings = user.get_db_system_geocoding_calls(date_from, date_to)
        # We don't want cycles with 0 geocoding calls
        next unless geocodings > 0
        quota = user.account_type != 'FREE' ? nil : user.geocoding_quota
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

# encoding: utf-8

namespace :cartodb do
  desc "Adapt max_import_file_size according to disk quota"
  task :setup_max_import_file_size_based_on_disk_quota => :environment do
    mid_size = 500*1024*1024
    big_size = 1000*1024*1024

    ::User.all.each do |user|
      quota_in_mb = user.quota_in_bytes/1024/1024
      if quota_in_mb >= 450 && quota_in_mb < 1500
        user.max_import_file_size = mid_size
        user.save
        print "M"
      elsif quota_in_mb >= 1500
        user.max_import_file_size = big_size
        user.save
        print "B"
      else
        print "."
      end
    end
    puts "\n"
  end

  desc "Adapt max_import_table_row_count according to disk quota"
  task :setup_max_import_table_row_count_based_on_disk_quota => :environment do
    mid_count = 1000000
    big_count = 5000000

    ::User.all.each do |user|
      quota_in_mb = user.quota_in_bytes/1024/1024
      if quota_in_mb >= 50 && quota_in_mb < 1000
        user.max_import_table_row_count = mid_count
        user.save
        print "M"
      elsif quota_in_mb >= 1000
        user.max_import_table_row_count = big_count
        user.save
        print "B"
      else
        print "."
      end
    end
    puts "\n"
  end

  desc "Increase limits for twitter import users"
  task :increase_limits_for_twitter_import_users => :environment do
    file_size_quota = 1500*1024*1024
    row_count_quota = 5000000

    ::User.where(twitter_datasource_enabled: true).each do |user|
      # Only increase, don't decrease
      user.max_import_file_size = file_size_quota if file_size_quota > user.max_import_file_size
      user.max_import_table_row_count = row_count_quota if row_count_quota > user.max_import_table_row_count
      user.save
      puts "#{user.username}"
    end
  end

  desc "Set custom platform limits for a user"
  task :set_custom_limits_for_user, [:username, :import_file_size, :table_row_count, :concurrent_imports] => :environment do |task_name, args|

    raise "Invalid username supplied" if args[:username].nil?
    raise "Invalid import size" if args[:import_file_size].nil? || args[:import_file_size].to_i <= 0
    raise "Invalid tabel row count" if args[:table_row_count].nil? || args[:table_row_count].to_i <= 0
    raise "Invalid concurrent imports" if args[:concurrent_imports].nil? || args[:concurrent_imports].to_i <= 0

    user = ::User.where(username: args[:username]).first

    raise "User not found" if user.nil?

    user.max_import_file_size = args[:import_file_size].to_i
    user.max_import_table_row_count = args[:table_row_count].to_i
    user.max_concurrent_import_count = args[:concurrent_imports].to_i
    user.save
  end

  desc 'Set max_import_file_size, max_import_table_row_count'
  task :set_import_limits, [:username, :max_import_file_size, :max_import_table_row_count] => :environment do |_task, args|
    username = args[:username]
    raise 'username needed' unless username
    user = ::User.where(username: username).first
    raise "user #{username} not found" unless user


    user.max_import_file_size = args[:max_import_file_size] if args[:max_import_file_size].present?
    user.max_import_table_row_count = args[:max_import_table_row_count] if args[:max_import_table_row_count].present?

    user.save
  end

end

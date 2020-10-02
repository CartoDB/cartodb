#!/usr/bin/env ruby
# [RAILS_ENV=staging] bundle exec rails runner script/20200921_do_datasets_redis_report.rb
include ActionView::Helpers::NumberHelper

# header
puts "sync size\t\t datasets/total\t  username"
total_space_needed = 0
$users_metadata.keys('do:*:datasets').each do |k|
  username = k.split(':')[1]
  user = User.where(username: username).first
  extra_quota_needed = 0

  datasets = $users_metadata.hget(k, :bq)
  datasets = JSON.parse(datasets)

  user_datasets = []
  syncable_datasets = []
  datasets.map do |dataset|
    # Do not process already enriched datasets:
    next if dataset['sync_status'].present?

    begin
      doss = Carto::DoSyncServiceFactory.get_for_user(user)
      entity_info = doss.entity_info(dataset['dataset_id'])
      num_bytes = entity_info['num_bytes'].to_i || 0
      if num_bytes <= 2_147_483_648
        extra_quota_needed += num_bytes
        syncable_datasets << dataset
      end
      user_datasets << dataset
    rescue Google::Apis::ClientError => e
      # pass
    end
  end
  total_space_needed += extra_quota_needed
  unless user_datasets.empty?
    # printing user's report:
    puts "#{number_to_human_size(extra_quota_needed)}\t\t #{syncable_datasets.size}/#{user_datasets.size}\t\t #{username} "
  end
rescue StandardError
  puts "** Error with #{username} **"
end
puts "------\nTotal extra quota: #{number_to_human_size(total_space_needed)} (#{total_space_needed} bytes)"

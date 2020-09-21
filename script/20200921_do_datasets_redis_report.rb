#!/usr/bin/env ruby
# bundle exec rails runner script/20200921_do_datasets_redis_report.rb
include ActionView::Helpers::NumberHelper

$users_metadata.keys("do:*:datasets").each do |k|
  username = k.split(':')[1]
  user = User.where(username: username).first
  extra_quota_needed = 0

  datasets = $users_metadata.hget(k, :bq)
  datasets = JSON.parse(datasets)

  user_datasets = []
  syncable_datasets = []
  datasets.map do |dataset|
    # Do not process already enriched datasets:
    if !(dataset['num_bytes'].present?) then
      begin
        doss = Carto::DoSyncServiceFactory.get_for_user(user)
        entity_info = doss.entity_info(dataset['dataset_id'])
        num_bytes = entity_info['num_bytes'].to_i || 0
        if num_bytes <= 2147483648 then
          extra_quota_needed += num_bytes
          syncable_datasets << dataset
        end
        user_datasets << dataset
      rescue Google::Apis::ClientError => e
        # pass
      end
    end
  end
  if !user_datasets.empty? then
    # printing user's report:
    puts "** User #{username} has #{user_datasets.size} datasets (#{syncable_datasets.size} syncable). \
     \n\tTotal extra quota: #{extra_quota_needed} (#{number_to_human_size(extra_quota_needed)})"
  end
end

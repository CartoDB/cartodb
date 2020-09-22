#!/usr/bin/env ruby
# [RAILS_ENV=staging] bundle exec rails runner script/20200922_do_datasets_remove_redis_fields.rb <username>

if ARGV.length != 1 then
  puts "*** Please introduce the target username (or --all to update them all) ***"
  exit
end

username = (ARGV[0] != '--all')? ARGV[0] : '*'
puts "Un-update user: #{username}..."

$users_metadata.keys("do:#{username}:datasets").each do |k|
  user = User.where(username: username).first

  datasets = $users_metadata.hget(k, :bq)
  datasets = JSON.parse(datasets)
  oldy_datasets = datasets.map do |dataset|
    # Do not process already enriched datasets:
    if dataset['sync_status'].present? then
      oldy_dataset = {
        dataset_id: dataset['dataset_id'],
        expires_at: dataset['expires_at'] || (Time.parse(dataset['expires_at']) - 1.year).to_s
      }
    end
    puts "Un-update: #{dataset['dataset_id']} for #{username}"
    oldy_dataset
  end
  $users_metadata.hmset(k, :bq, oldy_datasets.to_json)
end

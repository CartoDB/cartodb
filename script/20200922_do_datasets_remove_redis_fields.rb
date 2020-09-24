#!/usr/bin/env ruby
# [RAILS_ENV=staging] bundle exec rails runner script/20200922_do_datasets_remove_redis_fields.rb <username>

if ARGV.length != 1 then
  puts "*** Please introduce the target username (or --all to update them all) ***"
  exit
end

username = (ARGV[0] != '--all')? ARGV[0] : '*'
puts "Un-update user: #{username}..."

def delete_table(table_id)
  begin
    Carto::UserTable.find(table_id).visualization.destroy
  rescue
  end
end

$users_metadata.keys("do:#{username}:datasets").each do |k|
  user = User.where(username: username).first

  datasets = $users_metadata.hget(k, :bq)
  datasets = JSON.parse(datasets)
  oldy_datasets = datasets.map do |dataset|
    oldy_dataset = dataset
    if dataset['sync_status'].present? then
      # Note this will not change the user's quota, so be carefull if you have to execute this script multiple times
      delete_table(dataset['sync_table_id']) unless !dataset['sync_table_id']
      oldy_dataset = {
        dataset_id: dataset['dataset_id'],
        expires_at: dataset['expires_at']
      }
    end
    puts "Un-update: #{dataset['dataset_id']} for #{username}"
    oldy_dataset
  end
  $users_metadata.hmset(k, :bq, oldy_datasets.to_json)
end

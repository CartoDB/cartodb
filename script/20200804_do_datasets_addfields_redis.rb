#!/usr/bin/env ruby
# [RAILS_ENV=staging] bundle exec rails runner script/20200804_do_datasets_addfields_redis.rb <username>

if ARGV.length != 1 then
  puts "*** Please introduce the target username (or --all to update them all) ***"
  exit
end

def get_sync(doss, dataset_id)
  begin
    doss.sync(dataset_id, true).merge(doss.sync(dataset_id))
  rescue
  end
end

username = (ARGV[0] != '--all')? ARGV[0] : '*'
puts "Updating user: #{username}..."

$users_metadata.keys("do:#{username}:datasets").each do |k|
  username = k.split(':')[1]
  user = User.where(username: username).first
  datasets = $users_metadata.hget(k, :bq)
  datasets = JSON.parse(datasets)
  doss = Carto::DoSyncServiceFactory.get_for_user(user)

  datasets_enriched = datasets.map do |dataset|
    # Do not process already enriched datasets:
    if !(dataset['sync_status'].present?) || !(dataset['type'].present?) then
      begin
        sync_data = get_sync(doss, dataset['dataset_id']) || {}

        # Initial quick&dirty hack.
        # Since there is no public datasets yet,
        # We don't want this to check the user quota (which is the last check in db-connector)
        if !sync_data[:unsyncable_reason].nil? && (sync_data[:unsyncable_reason].include? "exceeds the quota available") then
          sync_data[:unsyncable_reason] = nil
          sync_data[:sync_status] = 'unsynced'
        end
        if sync_data.empty? then  # it can be a `requested` case
          sync_data[:unsyncable_reason] = nil
          sync_data[:sync_status] = 'unsynced'
        end

        expires_at = Time.parse(dataset['expires_at'])
        prev_created_at = dataset['created_at'] ? Time.parse(dataset['created_at']) : nil
        created_at = prev_created_at || (expires_at - 1.year)
        today = Time.now
        created_at = (created_at < today) ? created_at.to_s : today.to_s

        status = (expires_at && (today >= expires_at)) ? 'expired' : dataset['status']

        dataset = dataset.merge({
          status: status || 'active',
          created_at: created_at,
          available_in: ['bq'],
          type: sync_data[:type],
          estimated_size: sync_data[:estimated_size],
          estimated_row_count: sync_data[:estimated_row_count],
          estimated_columns_count: sync_data[:estimated_columns_count],
          num_bytes: sync_data[:num_bytes],
          sync_status: sync_data[:sync_status],
          unsyncable_reason: sync_data[:unsyncable_reason],
          unsynced_errors: [],
          sync_table: sync_data[:sync_table],
          sync_table_id: sync_data[:sync_table_id],
          synchronization_id: sync_data[:synchronization_id],
        })
        puts "Update: #{dataset['dataset_id']} for #{username}"
      rescue Google::Apis::ClientError => e
        puts "Not found in BQ: #{dataset['dataset_id']}"
        # leaving it as is:
        dataset
      end
    end
    dataset
  end
  $users_metadata.hmset(k, :bq, datasets_enriched.to_json)
end

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
  user = User.where(username: username).first
  datasets = $users_metadata.hget(k, :bq)
  datasets = JSON.parse(datasets)

  datasets_enriched = datasets.map do |dataset|
    # Do not process already enriched datasets:
    if !(dataset['unsynced_errors'].present?) then
      begin
        doss = Carto::DoSyncServiceFactory.get_for_user(user)
        sync_data = get_sync(doss, dataset['dataset_id']) || {}

        # Initial quick&dirty hack.
        # Since there is no public datasets yet,
        # We don't want this to check the user quota (which is the last check in db-connector)
        if !sync_data[:unsyncable_reason].nil? && (sync_data[:unsyncable_reason].include? "exceeds the quota available") then
          sync_data[:unsyncable_reason] = nil
          sync_data[:sync_status] = 'unsynced'
        end
        if sync_data.empty? then  # indeed, should be a `requested` case
          sync_data[:unsyncable_reason] = nil
          sync_data[:sync_status] = 'unsynced'
        end
        created_at = dataset['created_at'] || nil
        if created_at.nil? then
          from_expiration = (Time.parse(dataset['expires_at']) - 1.year)
          today = Time.now
          created_at = (from_expiration < toda) ? from_expiration.to_s : today.to_s
        end

        dataset = dataset.merge({
          status: dataset['status'] || 'active',
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
      rescue Google::Apis::ClientError => e
        puts "Not found in BQ: #{dataset['dataset_id']}"
        # leaving it as is:
        dataset
      end
    end
    puts "Update: #{dataset['dataset_id']} for #{username}"
    dataset
  end
  $users_metadata.hmset(k, :bq, datasets_enriched.to_json)
end

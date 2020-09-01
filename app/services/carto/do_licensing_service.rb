module Carto
  class DoLicensingService

    AVAILABLE_STORAGES = %w(bq bigtable carto).freeze
    PRESELECTED_STORAGE = 'bq'.freeze

    def initialize(username)
      @user = User.where(username: username).first
      @doss = Carto::DoSyncServiceFactory.get_for_user(@user)
      @redis_key = "do:#{@user.username}:datasets"
    end

    def subscribe(dataset)
      Cartodb::Central.new.create_do_datasets(username: @user.username, datasets: [dataset])
      add_to_redis(dataset)
    end

    def unsubscribe(dataset_id)
      Cartodb::Central.new.remove_do_dataset(username: @user.username, id: dataset_id)
      remove_from_redis(dataset_id)
    end

    def subscriptions
      JSON.parse($users_metadata.hget(@redis_key, PRESELECTED_STORAGE) || '[]').map { |s| present_subscription(s) }
    end

    def subscription(subscription_id)
      subscriptions.find{ |s| s['id'] == subscription_id}
    end

    def add_to_redis(dataset)
      value = AVAILABLE_STORAGES.map { |storage| [storage, insert_redis_value(dataset, storage)] }.flatten
      $users_metadata.hmset(@redis_key, value)
    end

    def remove_from_redis(dataset_id)
      value = AVAILABLE_STORAGES.map { |storage| [storage, remove_redis_value(dataset_id, storage)] }.flatten
      $users_metadata.hmset(@redis_key, value)
    end

    private

    def present_subscription(subscription)
      parsed_entity_id = @doss.parsed_entity_id(subscription['dataset_id'])
      expires_at = Time.parse(subscription['expires_at']) if subscription['expires_at'].present?
      subscription_data = subscription.merge(parsed_entity_id).merge({
        status: (expires_at && (Time.now >= expires_at)) ? 'expired' : subscription['status']
      })
      subscription_data.with_indifferent_access
    end

    def insert_redis_value(dataset, storage)
      redis_value = JSON.parse($users_metadata.hget(@redis_key, storage) || '[]')
      if dataset[:available_in].include?(storage)
        # Remove a previous dataset if exists
        redis_value = redis_value.reject { |d| d['dataset_id'] == dataset[:dataset_id] }
        # Create the new entry
        new_value = [{
          dataset_id: dataset[:dataset_id],
          expires_at: dataset[:expires_at].to_s,
          status: dataset[:status],
          available_in: dataset[:available_in],
          type: dataset[:type],
          estimated_size: dataset[:estimated_size].to_i,
          estimated_row_count: dataset[:estimated_row_count].to_i,
          estimated_columns_count: dataset[:estimated_columns_count].to_i,
          num_bytes: dataset[:num_bytes].to_i,
          sync_status: dataset[:sync_status] || 'unsynced',
          sync_table: dataset[:sync_table] || nil,
          sync_table_id: dataset[:sync_table_id] || nil,
          synchronization_id: dataset[:synchronization_id] || nil
        }]
        # Append to the current one
        redis_value = redis_value + new_value
      end

      redis_value.to_json
    end

    def remove_redis_value(dataset_id, storage)
      redis_value = JSON.parse($users_metadata.hget(@redis_key, storage) || '[]')
      redis_value.reject { |dataset| dataset["dataset_id"] == dataset_id }.to_json
    end

  end
end

module Carto
  class DoLicensingService

    AVAILABLE_STORAGES = %w(bq bigtable carto).freeze
    PRESELECTED_STORAGE = 'bq'.freeze
    CARTO_DO_PROJECT = 'carto-do'.freeze
    CARTO_DO_PUBLIC_PROJECT = 'carto-do-public-data'.freeze

    def initialize(username)
      @user = Carto::User.find_by(username: username)
      @doss = Carto::DoSyncServiceFactory.get_for_user(@user)
      @redis_key = "do:#{@user.username}:datasets"
    end

    def subscribe(dataset)
      Cartodb::Central.new.create_do_datasets(username: @user.username, datasets: [dataset])
      add_to_redis(dataset)
    end

    def update(subscription_id, params)
      Cartodb::Central.new.update_do_subscription(username: @user.username, subscription_id: subscription_id,  subscription_params: params)
      updated_subscription = subscription(subscription_id).merge(params)
      add_to_redis(updated_subscription)
      updated_subscription
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

    def get_sync_status(subscription_id)
      return @doss.sync(subscription_id)
    end

    private

    def present_subscription(subscription)
      parsed_entity_id = @doss.parsed_entity_id(subscription['dataset_id'])
      expires_at = Time.parse(subscription['expires_at']) if subscription['expires_at'].present?
      subscription_data = subscription.merge(parsed_entity_id).merge({
        id: subscription['dataset_id'],
        status: (expires_at && (Time.now >= expires_at)) ? 'expired' : subscription['status'],
      })
      subscription_data.with_indifferent_access
    end

    def insert_redis_value(dataset, storage)
      redis_value = JSON.parse($users_metadata.hget(@redis_key, storage) || '[]')
      if dataset[:available_in].include?(storage)
        # Remove a previous dataset if exists
        redis_value = redis_value.reject { |d| d['dataset_id'] == dataset[:dataset_id] }

        # Initial sync status
        sync_status = dataset[:sync_status]
        unsyncable_reason = dataset[:unsyncable_reason]
        entity_info = (dataset[:status] != 'requested') ? get_entity_info(dataset[:dataset_id]) : {}
        if sync_status.nil? then
          sync_status, unsyncable_reason = get_initial_sync_status(dataset, entity_info)
        end

        # Create the new entry
        new_value = [{
          dataset_id: dataset[:dataset_id],
          created_at: dataset[:created_at].to_s,
          expires_at: dataset[:expires_at].to_s,
          status: dataset[:status],
          available_in: dataset[:available_in],
          license_type: dataset[:license_type],
          full_access_status_bq: dataset[:full_access_status_bq],
          full_access_status_azure: dataset[:full_access_status_azure],
          full_access_status_aws: dataset[:full_access_status_aws],
          full_access_aws_info: dataset[:full_access_aws_info],
          full_access_azure_info: dataset[:full_access_azure_info],
          type: dataset[:type],
          estimated_size: entity_info[:estimated_size].to_i || 0,
          estimated_row_count: entity_info[:estimated_row_count].to_i || 0,
          estimated_columns_count: entity_info[:estimated_columns_count].to_i || 0,
          num_bytes: entity_info[:num_bytes].to_i || 0,
          sync_status: sync_status,
          unsyncable_reason: unsyncable_reason,
          unsynced_errors: dataset[:unsynced_errors] || nil,
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

    def get_initial_sync_status(dataset, entity_info)
      sync_info = @doss.check_syncable(dataset) || @doss.check_sync_limits(dataset.merge({
        estimated_size: entity_info[:estimated_size].to_i || 0,
        estimated_row_count: entity_info[:estimated_row_count].to_i || 0,
        estimated_columns_count: entity_info[:estimated_columns_count].to_i || 0,
        num_bytes: entity_info[:num_bytes].to_i || 0
      }))
      if sync_info then
        return sync_info[:sync_status], sync_info[:unsyncable_reason]
      elsif dataset[:status] == 'requested' then
        return 'unsynced', nil
      else
        return 'syncing', nil
      end
    end

    def get_entity_info(dataset_id)
      @doss.entity_info(dataset_id)
    end

  end
end

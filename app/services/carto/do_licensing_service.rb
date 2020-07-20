module Carto
  class DoLicensingService

    AVAILABLE_STORAGES = %w(bq bigtable carto).freeze
    PRESELECTED_STORAGE = 'bq'.freeze

    def initialize(username)
      @username = username
      @redis_key = "do:#{@username}:datasets"
    end

    def subscribe(dataset)
      Cartodb::Central.new.create_do_datasets(username: @username, datasets: [dataset])
      add_to_redis(dataset)
    end

    def unsubscribe(dataset_id)
      Cartodb::Central.new.remove_do_dataset(username: @username, id: dataset_id)
      remove_from_redis(dataset_id)
    end

    def subscriptions
      JSON.parse($users_metadata.hget(@redis_key, PRESELECTED_STORAGE) || '[]').map { |s| present_subscription(s) }
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
      qualified_id = subscription['dataset_id']
      project, dataset, table = qualified_id.split('.')
      # FIXME: better save the type in Redis or look for it in the metadata tables
      type = table&.starts_with?('geography') ? 'geography' : 'dataset'
      subscription = {
        project: project,
        dataset: dataset,
        table: table,
        id: qualified_id,
        type: type,
        expires_at: subscription['expires_at'] && Time.parse(subscription['expires_at']),
        created_at: subscription['created_at'] && Time.parse(subscription['created_at'])
      }
      subscription.with_indifferent_access
    end

    def insert_redis_value(dataset, storage)
      redis_value = JSON.parse($users_metadata.hget(@redis_key, storage) || '[]')

      if dataset[:available_in].include?(storage)
        # Remove a previous dataset if exists
        redis_value = redis_value.reject { |d| d[:dataset_id] == dataset[:dataset_id] }
        # Create the new entry
        new_value = [{ "dataset_id" => dataset[:dataset_id], "expires_at" => dataset[:expires_at].to_s }]
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

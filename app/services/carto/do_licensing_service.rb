module Carto
  class DoLicensingService

    def initialize(username)
      @username = username
      @redis_key = "do:#{@username}:datasets"
    end

    def subscribe(datasets)
      Cartodb::Central.new.create_do_datasets(username: @username, datasets: datasets)
      add_to_redis(datasets)
    end

    private

    def add_to_redis(datasets)
      value = ["bq", insert_redis_value(datasets, 'bq'), "spanner", insert_redis_value(datasets, 'spanner')]

      $users_metadata.hmset(@redis_key, value)
    end

    def insert_redis_value(datasets, storage)
      redis_value = JSON.parse($users_metadata.hget(@redis_key, storage) || '[]')
      new_datasets = filter_datasets(datasets, storage)
      (redis_value + new_datasets).uniq.to_json
    end

    def filter_datasets(datasets, storage)
      filtered_datasets = datasets.select { |dataset| dataset[:available_in]&.include?(storage) }
      filtered_datasets.map do |dataset|
        { "dataset_id" => dataset[:dataset_id], "expires_at" => dataset[:expires_at].to_s }
      end
    end

  end
end

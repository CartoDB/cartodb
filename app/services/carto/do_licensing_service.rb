module Carto
  class DoLicensingService

    def initialize(username)
      @username = username
    end

    def purchase(datasets)
      Cartodb::Central.new.create_do_datasets(username: @username, datasets: datasets)

      bq_datasets = filter_datasets(datasets, 'bq')
      spanner_datasets = filter_datasets(datasets, 'spanner')
      redis_key = "do:#{@username}:datasets"
      redis_value = ["bq", bq_datasets.to_json, "spanner", spanner_datasets.to_json]
      # TODO: merge values, not replace
      $users_metadata.hmset(redis_key, redis_value)
    end

    private

    def filter_datasets(datasets, storage)
      filtered_datasets = datasets.select { |dataset| dataset[:available_in].include?(storage) }
      filtered_datasets.map { |dataset| dataset.slice(:dataset_id, :expires_at) }
    end

  end
end

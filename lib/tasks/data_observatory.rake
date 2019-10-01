# Datasets CSV example:
# bbva.financial_basicstats_spain_censustracts_2011_monthly_2017,bq;spanner,999,2020-09-27T08:00:00
# mastercard.geography_usa_blockgroup_2019,bq,2000,2020-09-27T08:00:00
namespace :cartodb do
  namespace :data_observatory do
    desc "Enables access to DO datasets for a user and saves the metadata in Central and Redis"
    task :purchase_datasets, [:username, :datasets_csv] => [:environment] do |_, args|
      username = args[:username]
      datasets_csv = args[:datasets_csv]
      usage = 'USAGE: data_observatory:purchase_datasets["username","path/datasets.csv"]'
      raise usage unless username.present? && datasets_csv.present?

      datasets = []
      bq_datasets = []
      spanner_datasets = []
      CSV.foreach(args[:datasets_csv]) do |row|
        available_in = row[1].split(';')
        dataset = { dataset_id: row[0], available_in: available_in, price: row[2].to_f, expires_at: Time.parse(row[3]) }
        datasets << dataset
        bq_datasets << dataset.slice(:dataset_id, :expires_at) if available_in.include?('bq')
        spanner_datasets << dataset.slice(:dataset_id, :expires_at) if available_in.include?('spanner')
      end

      Cartodb::Central.new.create_do_datasets(username: username, datasets: datasets)

      redis_key = "do:#{username}:datasets"
      redis_value = ["bq", bq_datasets, "spanner", spanner_datasets]
      $users_metadata.hmset(redis_key, redis_value)

      puts 'Task finished succesfully!'
    end
  end
end

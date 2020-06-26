# Datasets CSV example:
# dataset_id,available_in,price,expires_at,view_def
# carto-do-public-data.open_data.geography_usa_state_2015,bq;bigtable,999,2020-09-27T08:00:00
# carto-do-public-data.open_data.demographics_acs_usa_cbsaclipped_2015_yearly_2015,bq,2000,2020-09-27T08:00:00
namespace :cartodb do
  namespace :data_observatory do
    desc "Enables access to DO datasets for a user and saves the metadata in Central and Redis"
    task :purchase_datasets, [:username, :datasets_csv] => [:environment] do |_, args|
      username = args[:username]
      datasets_csv = args[:datasets_csv]
      usage = 'USAGE: data_observatory:purchase_datasets["username","path/datasets.csv"]'
      raise usage unless username.present? && datasets_csv.present?

      datasets = []
      CSV.foreach(args[:datasets_csv], headers: true) do |row|
        available_in = row['available_in'].split(';')
        dataset = {
          dataset_id: row['dataset_id'],
          available_in: available_in,
          price: row['price'].to_f,
          expires_at: Time.parse(row['expires_at']),
          view_def: row['view_def']
        }
        Carto::DoLicensingService.new(username).subscribe(dataset)
        puts "#{row['dataset_id']} licensed succesfully"
      end

      puts 'Task finished succesfully!'
    end

    desc "Removes access to a DO dataset for a user and updates the metadata in Central and Redis"
    task :remove_purchase, [:username, :dataset_id] => [:environment] do |_, args|
      username = args[:username]
      dataset_id = args[:dataset_id]
      usage = 'USAGE: data_observatory:remove_purchase["username","project.schema.table"]'
      raise usage unless username.present? && dataset_id.present?

      Carto::DoLicensingService.new(username).unsubscribe(dataset_id)

      puts 'Task finished succesfully!'
    end
  end
end

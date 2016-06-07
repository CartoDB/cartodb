# coding: UTF-8

namespace :cartodb do
  namespace :common_data do
    desc 'Generates datasets assets and upload them to Amazon S3'
    task :generate_s3_assets, [:all_public] => :environment do |t, args|
      all_public = args[:all_public].blank? ? false : args[:all_public]
      common_data = CommonData.new
      common_data.upload_datasets_to_s3 all_public
    end

    desc 'Import all the common datasets from CartoDB into the local common data user account'
    task import_common_data: [:environment] do
      # temporarily set base URL to remote so dataset URLs will be correct
      Cartodb.config[:common_data]["base_url"] = "https://common-data.cartodb.com"
      common_data = CommonData.new('https://common-data.cartodb.com/api/v1/viz?type=table&privacy=public')
      username = Cartodb.config[:common_data]["username"]
      user = User.find(:username=>username)
      raise "User #{username} not found" if not user
      raise "No datasets found to import" if common_data.datasets.size == 0
      datasets = common_data.datasets
      datasets.each do |dataset|
        data_import = DataImport.create(:user_id => user.id, :data_source => dataset["url"])
        data_import.run_import!
        if not data_import.success
          puts "Dataset '#{dataset['name']}' failed to import"
        end
      end
      # unset base URL when done
      Cartodb.config[:common_data].delete("base_url")
    end

  end
end

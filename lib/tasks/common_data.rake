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
      old_base_url = Cartodb.config[:common_data]["base_url"]
      # temporarily set base URL to remote so dataset URLs will be correct
      Cartodb.config[:common_data]["base_url"] = "https://common-data.carto.com"
      common_data = CommonData.new('https://common-data.carto.com/api/v1/viz?type=table&privacy=public')
      username = Cartodb.config[:common_data]["username"]
      user = User.find(:username=>username)
      raise "User #{username} not found" if not user
      datasets = common_data.datasets
      raise "No datasets found to import" if datasets.size == 0
      if user.table_quota and user.table_quota < datasets.size
        raise "Common data user #{username} has a table quota too low to import all common datasets"
      end
      failed_imports = 0
      datasets.each do |dataset|
        begin
            data_import = DataImport.create(:user_id => user.id, :data_source => dataset["url"])
            data_import.run_import!
            if not data_import.success
              puts "Dataset '#{dataset['name']}' failed to import. Error code: #{data_import.error_code}"
              failed_imports += 1
            end
        rescue => exception
            puts "Error importing dataset '#{dataset['name']}' : #{exception}"
            failed_imports += 1
        end
        ActiveRecord::Base.connection.close
      end
      # unset base URL when done
      if old_base_url
        Cartodb.config[:common_data]["base_url"] = old_base_url
      else
        Cartodb.config[:common_data].delete("base_url")
      end

      if failed_imports > 0
        puts "Failed to import #{failed_imports} of #{datasets.size} common datasets."
        raise "Failed to import any common datasets" if failed_imports == datasets.size
      end

      # (re-)load common datasets for all users
      CommonDataRedisCache.new.invalidate
      cds = CartoDB::Visualization::CommonDataService.new
      url = CartoDB.base_url(username) + "/api/v1/viz?type=table&privacy=public"
      User.each do |u|
        u.update(:last_common_data_update_date=>nil)
        u.save
        cds.load_common_data_for_user(u, url)
      end
    end

  end
end

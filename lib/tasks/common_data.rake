# coding: UTF-8

namespace :cartodb do
  namespace :common_data do
    desc 'Generates datasets assets and upload them to Amazon S3'
    task :generate_s3_assets, [:all_public] => :environment do |t, args|
      all_public = args[:all_public].blank? ? false : args[:all_public]
      common_data = CommonData.new
      common_data.assets_to_upload(all_public) { |asset|
        body = asset[:body][]
        retries = 0
        begin
          retries += 1
          url = CommonData.upload_to_s3("#{asset[:table_name]}.zip", body)
          puts "#{asset[:table_name]} was uploaded to #{url}"
        rescue
          if retries >= 3
            puts "#{asset[:table_name]} failed to upload. Updating "
            common_data.update_table_metadata(asset[:table_name])
          else
            sleep 5
            retry
          end
        end
      }
    end
  end
end

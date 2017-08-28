require_relative '../../services/user-mover/export_user.rb'
require_relative '../../services/user-mover/import_user.rb'
require_relative '../../app/services/carto/organization_metadata_export_service'

namespace :cartodb do
  namespace :user_migrator do
    namespace :export do
      desc 'Export an organization'
      task :organization, [:orgname] => :environment do |_task, args|
        organization = Carto::Organization.find_by_name(args[:orgname])
        work_dir = Cartodb.get_config(:user_migrator, 'user_exports_folder') || '/tmp'
        path = "#{work_dir}/#{organization.id}"

        FileUtils.mkdir_p(path + '/data')
        FileUtils.mkdir_p(path + '/meta')

        CartoDB::DataMover::ExportJob.new(
          organization_name: organization.name,
          schema_mode: true,
          split_user_schemas: true,
          path: path + '/data'
        )
        Carto::OrganizationMetadataExportService.new.export_organization_to_directory(organization, path + '/meta')

        `cd #{work_dir}/ && zip -0 -r \"#{organization.id}.zip\" #{organization.id} && cd -`
        FileUtils.remove_dir(path)
        puts "Exported to #{work_dir}/#{organization.id}.zip"
      end
    end

    namespace :import do
      desc 'Import an organization'
      task :organization, [:export_file, :database_ip] => :environment do |_task, args|
        export_file = args[:export_file]
        Dir.mktmpdir do |work_dir|
          `cd #{work_dir}/ && unzip -u #{export_file} && cd -`
          path = Dir["#{work_dir}/*"].first

          service = Carto::OrganizationMetadataExportService.new
          imported_organization = service.import_from_directory("#{path}/meta")
          CartoDB::DataMover::ImportJob.new(
            file: Dir["#{path}/data/org*json"].first,
            data: true,
            metadata: false,
            host: args[:database_ip],
            rollback: false,
            mode: :import,
            set_banner: false
          ).run!
          service.import_metadata_from_directory(imported_organization, "#{path}/meta")

          imported_organization.users.each { |u| u.update_attribute(:last_common_data_update_date, nil) }
        end
      end
    end
  end
end

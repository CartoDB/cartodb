require_relative '../../services/user-mover/export_user.rb'
require_relative '../../services/user-mover/import_user.rb'
require_relative '../../app/services/carto/organization_metadata_export_service'

namespace :cartodb do
  namespace :user_migrator do
    namespace :export do
      def run_user_migrator_export_job(ume)
        if ume.organization
          puts "Exporting organization #{ume.organization.name}"
        else
          puts "Exporting user #{ume.user.username}"
        end
        if ume.export_metadata
          puts "Including metadata (moving between clouds)"
        else
          puts "Without metadata (moving inside a single cloud)"
        end
        puts 'Control + C to cancel (will continue in 5 seconds)'
        sleep 5

        ume.save!
        puts "Running export with id = #{ume.id}"
        ume.run_export
        puts "Export finished with status #{ume.state}"
        if ume.state == Carto::UserMigrationExport::STATE_COMPLETE
          import_params = {
            org_import: ume.organization.present?,
            import_metadata: ume.export_metadata,
            exported_file: ume.exported_file,
            json_file: ume.json_file,
            dry: false,
            database_host: '<destination db host>'
          }
          import_params[:user_id] = ume.user_id if !ume.export_metadata && ume.user_id
          import_params[:organization_id] = ume.organization_id if !ume.export_metadata && ume.organization_id
          config_filename = "/tmp/import_for_#{ume.id}.json"
          puts "Pass the following parameters to the import task"
          puts JSON.pretty_generate(import_params)
          File.write(config_filename, JSON.pretty_generate(import_params))
          puts "Written to #{config_filename}"
          puts "Don't forget to update the database host"
        else
          puts ume.log.entries
        end
      end

      desc 'Export an organization'
      task :organization, [:orgname, :metadata] => :environment do |_task, args|
        organization = Carto::Organization.find_by_name(args[:orgname])
        raise 'Organization not found' unless organization
        export_metadata = args[:metadata] == 'true'

        ume = Carto::UserMigrationExport.new(
          organization: organization,
          export_metadata: export_metadata
        )
        run_user_migrator_export_job(ume)
      end

      desc 'Export a user'
      task :user, [:username, :metadata] => :environment do |_task, args|
        user = Carto::User.find_by_username(args[:username])
        raise 'User not found' unless user
        export_metadata = args[:metadata] == 'true'

        ume = Carto::UserMigrationExport.new(
          user: user,
          export_metadata: export_metadata
        )
        run_user_migrator_export_job(ume)
      end
    end

    desc 'Import a user migrator dump'
    task :import, [:config_file] => :environment do |_task, args|
      config = JSON.parse(File.read(args[:config_file])).symbolize_keys
      raise 'Set a database host' if config[:database_host].blank? || config[:database_host].include?('<')

      umi = Carto::UserMigrationImport.new(config)
      umi.save!
      puts "Running import with id = #{umi.id}"
      umi.run_import
      puts "Import finished with status #{umi.state}"
      puts umi.log.entries unless umi.state == Carto::UserMigrationImport::STATE_COMPLETE
    end
  end
end

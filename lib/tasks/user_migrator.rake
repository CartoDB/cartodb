require_relative '../../services/user-mover/export_user.rb'
require_relative '../../services/user-mover/import_user.rb'
require_relative '../../app/services/carto/organization_metadata_export_service'
require_relative '../../app/services/carto/redis_export_service'

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
            import_data: ume.export_data?,
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
          raise 'Failed Export!'
        end
      end

      desc 'Export an organization'
      task :organization, [:orgname, :metadata, :metadata_only] => :environment do |_task, args|
        organization = Carto::Organization.find_by_name(args[:orgname])
        raise 'Organization not found' unless organization
        export_metadata = args[:metadata] == 'true'
        metadata_only = args[:metadata_only] == 'true'

        ume = Carto::UserMigrationExport.new(
          organization: organization,
          export_metadata: export_metadata,
          export_data: !metadata_only
        )
        run_user_migrator_export_job(ume)
      end

      desc 'Export a user'
      task :user, [:username, :metadata, :metadata_only] => :environment do |_task, args|
        user = Carto::User.find_by_username(args[:username])
        raise 'User not found' unless user
        export_metadata = args[:metadata] == 'true'
        metadata_only = args[:metadata_only] == 'true'

        ume = Carto::UserMigrationExport.new(
          user: user,
          export_metadata: export_metadata,
          export_data: !metadata_only
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

    namespace :cleanup do
      module OrganizationMigrationCleanup
        def clean_organization_data(organization)
          conn = PG.connect(host: organization.owner.database_host,
                            user: CartoDB::DataMover::Config.config[:dbuser],
                            dbname: 'postgres',
                            port: CartoDB::DataMover::Config.config[:dbport],
                            connect_timeout: CartoDB::DataMover::Config.config[:connect_timeout])
          drop_db_and_role(conn, organization.owner.database_name, database_username(organization.owner.id))
        end

        def clean_user_data(user)
          conn = PG.connect(host: user.database_host,
                            user: CartoDB::DataMover::Config.config[:dbuser],
                            dbname: 'postgres',
                            port: CartoDB::DataMover::Config.config[:dbport],
                            connect_timeout: CartoDB::DataMover::Config.config[:connect_timeout])
          drop_db_and_role(conn, user.database_name, database_username(user.id))
        end



        def clean_user_metadata(user)
          carto_user = Carto::User.find(user.id)
          carto_user.assets.each(&:delete)
          carto_user.visualizatons.each(&:destroy)
          carto_user.destroy
          user.before_destroy(skip_table_drop: true)
        end

        def clean_organization_metadata(organization)
          organization.users.each { |u| clean_user_metadata(u) }
          organization.groups.delete
          organization.notifications.delete
          organization.assets.map(&:delete)
          organization.users.delete
          organization.delete
        end

        def clean_redis_user(user)
          remove_keys(
            $users_metadata,
            $users_metadata.keys("user:#{user.username}*")
          )
          remove_keys(
            $tables_metadata,
            $tables_metadata.keys("map_tpl|#{user.username}*")
          )
        end

        def clean_redis_organization(organization)
          remove_keys(
            $users_metadata,
            $users_metadata.keys("org:#{organization.name}*")
          )
          organization.users.each { |u| clean_redis_user(u) }
        end

        def clean_organization(organization)
          puts "Cleaning organization #{organization.name}"
          clean_organization_data(organization)
          clean_redis_organization(organization)
          clean_organization_metadata(organization)
        end

        private
        def drop_db_and_role(connection, db, role)
          connection.query("DROP DATABASE IF EXISTS \"#{db}\"")
          connection.query("DROP ROLE IF EXISTS \"#{role}\"")
        end
      end

      desc 'Cleans all organizations data and metadata matching filter in config file'
      task :organizations_from_file, [:config_file] => :environment do |_, args|
        include CartoDB::DataMover::Utils
        include OrganizationMigrationCleanup
        include ::Carto::RedisExportServiceImporter
        Organization.where(File.read(args[:config_file]).to_s).each { |org| clean_organization(org) }
      end

      desc 'Cleans all redis keys for given username'
      task :redis_for_username, [:username] => :environment do |_, args|
        include CartoDB::DataMover::Utils
        include OrganizationMigrationCleanup
        include ::Carto::RedisExportServiceImporter
        user = User.where("username = '#{args[:username]}'").first || User.new(username: args[:username])
        clean_redis_user(user)
      end

      desc 'Cleans all data for user with given username'
      task :user, [:username] => :environment do |_, args|
        include CartoDB::DataMover::Utils
        include OrganizationMigrationCleanup
        include ::Carto::RedisExportServiceImporter
        user = User.where("username = '#{args[:username]}'").first || User.new(username: args[:username])
        puts "Cleaning user #{user.username}"
        clean_user_data(user)
        clean_redis_user(user)
        clean_user_metadata(user)
      end

      desc 'Cleans redis keys for org with given name'
      task :redis_for_orgrname, [:orgname] => :environment do |_, args|
        include CartoDB::DataMover::Utils
        include OrganizationMigrationCleanup
        include ::Carto::RedisExportServiceImporter
        organization = Organization.where("name = #{args[:orgname]}").first || Organization.new(name: args[:orgname])
        clean_redis_organization(organization)
      end
    end
  end
end

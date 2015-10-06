require_relative '../../services/user-mover/export_user'
require_relative '../../services/user-mover/import_user'

namespace :cartodb do
  namespace :user_mover do
    namespace :export do
      desc 'Export an user'
      task :export_user, [:id, :path, :schema_mode, :database_only, :metadata_only] do |task, args|
        args.with_defaults(schema_mode: false, database_only: false, metadata_only: false)
        CartoDB::DataMover::ExportJob.new(args)
      end
      desc 'Export an organization'
      task :export_org, [:organization_name, :path, :database_only, :metadata_only] do |task, args|
        args.with_defaults(schema_mode: true, database_only: false, metadata_only: false)
        CartoDB::DataMover::ExportJob.new(args)
      end
    end


    namespace :import do
      desc 'Import a JSON export (either username or organization)'
      task :import, [:file, :data_only, :into_org_name, :database_host] do |task, args|
        args.with_defaults(data_only: false, database_host: nil, rollback: false, mode: :import)
        CartoDB::DataMover::ImportJob.new(args).run!
      end
      desc 'Rollback from a JSON export (either username or organization)'
      task :rollback, [:file, :data_only, :into_org_name, :database_host] do |task, args|
        args.with_defaults(data_only: false, database_host: nil, rollback: false, mode: :rollback)
        CartoDB::DataMover::ImportJob.new(args).run!
      end
    end
  end
end

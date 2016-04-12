require_relative '../../services/user-mover/export_user'
require_relative '../../services/user-mover/import_user'

namespace :cartodb do
  namespace :user_mover do
    namespace :export do
      desc 'Export an user'
      task :export_user, [:username, :path, :schema_mode, :database_only, :metadata_only] => :environment do |_task, args|
        args.with_defaults(schema_mode: false, database_only: false, metadata_only: false)
        CartoDB::DataMover::ExportJob.new(args)
      end
      desc 'Export an organization'
      task :export_org, [:organization_name, :path, :database_only, :metadata_only] => :environment do |_task, args|
        args.with_defaults(schema_mode: true, database_only: false, metadata_only: false)
        CartoDB::DataMover::ExportJob.new(args)
      end
    end

    namespace :import do
      desc 'Import a JSON export (either username or organization)'
      task :import, [:file, :data_only, :into_org_name, :host] => :environment do |_task, args|
        args.with_defaults(data_only: false, host: nil, rollback: false, into_org_name: nil, mode: :import)
        real_args = args.to_hash
        real_args[:data_only] = (real_args[:data_only] == 'true' ? true : false)
        real_args[:into_org_name] = (real_args[:into_org] != '' ? args[:into_org] : nil)
        CartoDB::DataMover::ImportJob.new(real_args).run!
      end
      desc 'Rollback from a JSON export (either username or organization)'
      task :rollback, [:file, :data_only, :host] => :environment do |_task, args|
        args.with_defaults(data_only: false, host: nil, rollback: false, mode: :rollback)
        args[:data_only] = args[:data_only] == 'true' ? true : false
        CartoDB::DataMover::ImportJob.new(args).run!
      end
    end
  end
end

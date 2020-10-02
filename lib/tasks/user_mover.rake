require_relative '../../services/user-mover/export_user'
require_relative '../../services/user-mover/import_user'

namespace :cartodb do
  namespace :user_mover do
    namespace :export do
      desc 'Export an user'
      task :export_user, [:id, :path, :job_uuid, :schema_mode, :database_only, :metadata_only] => :environment do |_task, args|
        args.with_defaults(job_uuid: nil, schema_mode: false, database_only: false, metadata_only: false)
        job_args = args.to_hash
        if job_args[:database_only] == 'true'
          job_args[:data] = true
          job_args[:metadata] = false
        elsif job_args[:metadata_only] == 'true'
          job_args[:data] = false
          job_args[:metadata] = true
        end
        CartoDB::DataMover::ExportJob.new(job_args)
      end
      desc 'Export an organization'
      task :export_org, [:organization_name, :path, :job_uuid, :database_only, :metadata_only, :split_user_schemas] => :environment do |_task, args|
        args.with_defaults(job_uuid: nil, database_only: false, metadata_only: false)
        job_args = args.to_hash
        if job_args[:database_only] == 'true'
          job_args[:data] = true
          job_args[:metadata] = false
        elsif job_args[:metadata_only] == 'true'
          job_args[:data] = false
          job_args[:metadata] = true
        end
        job_args[:split_user_schemas] = job_args[:split_user_schemas] == 'true'
        CartoDB::DataMover::ExportJob.new(job_args)
      end
    end

    namespace :import do
      desc 'Import a JSON export (either username or organization)'
      task :import, [:file, :data_only, :into_org_name, :host, :job_uuid] => :environment do |_task, args|
        args.with_defaults(job_uuid: nil, data_only: false, host: nil, rollback: false, into_org_name: nil, mode: :import)
        job_args = args.to_hash
        if job_args[:data_only] == 'true'
          job_args[:data] = true
          job_args[:metadata] = false
        end
        job_args[:into_org_name] = (job_args[:into_org] != '' ? args[:into_org] : nil)
        CartoDB::DataMover::ImportJob.new(job_args).run!
      end
      desc 'Rollback from a JSON export (either username or organization)'
      task :rollback, [:file, :data_only, :host] => :environment do |_task, args|
        args.with_defaults(data_only: false, host: nil, rollback: false, mode: :rollback)
        job_args = args.to_hash
        if job_args[:data_only] == 'true'
          job_args[:data] = true
          job_args[:metadata] = false
        end
        CartoDB::DataMover::ImportJob.new(job_args).run!
      end
    end
  end
end

require 'active_record'
require 'fileutils'
require_relative '../../../services/user-mover/export_user'
require_dependency 'file_upload'
require_dependency 'resque/user_migration_jobs'
require_dependency 'carto/ghost_tables_manager'

module Carto
  class UserMigrationExport < ::ActiveRecord::Base
    belongs_to :organization, class_name: Carto::Organization
    belongs_to :user, class_name: Carto::User
    belongs_to :log, class_name: Carto::Log

    STATE_PENDING = 'pending'.freeze
    STATE_EXPORTING = 'exporting'.freeze
    STATE_UPLOADING = 'uploading'.freeze
    STATE_COMPLETE = 'complete'.freeze
    STATE_FAILURE = 'failure'.freeze
    VALID_STATES = [STATE_PENDING, STATE_EXPORTING, STATE_UPLOADING, STATE_COMPLETE, STATE_FAILURE].freeze

    after_initialize :set_defaults

    validates :state, inclusion: { in: VALID_STATES }
    validate  :user_or_organization_present
    validate  :validate_export_data

    def run_export
      check_valid_user(user) if user && export_metadata
      check_valid_organization(organization) if organization && export_metadata
      check_custom_plpython2_functions

      log.append("=== Exporting #{organization ? 'user' : 'org'} data ===")
      update_attributes(state: STATE_EXPORTING)

      package = if backup
                  UserMigrationPackage.for_backup("backup_#{user.username}_#{Time.now.iso8601}", log)
                else
                  UserMigrationPackage.for_export(id, log)
                end

      export_job = CartoDB::DataMover::ExportJob.new(export_job_arguments(package.data_dir)) if export_data?

      run_metadata_export(package.meta_dir) if export_metadata?

      log.append("=== Uploading ===")
      update_attributes(
        state: STATE_UPLOADING,
        json_file: export_data? ? "#{id}/#{export_job.json_file}" : 'no_data_exported'
      )
      uploaded_path = package.upload

      state = uploaded_path.present? ? STATE_COMPLETE : STATE_FAILURE
      log.append("=== Finishing. State: #{state}. File: #{uploaded_path} ===")
      update_attributes(state: state, exported_file: uploaded_path)

      true
    rescue StandardError => e
      log.append_exception('Exporting', exception: e)
      log_error(exception: e, message: 'Error exporting user data', error_detail: inspect)
      update_attributes(state: STATE_FAILURE)

      false
    ensure
      log.store
      package.try(:cleanup)
    end

    def enqueue
      Resque.enqueue(Resque::UserMigrationJobs::Export, export_id: id)
    end

    private

    # TODO: delete this once migration to plpython3 is completed
    def check_custom_plpython2_functions
      target_user = user || organization.owner

      pg_result = target_user.in_database(as: :superuser).execute(%{
        select
          nspname, proname
        from
          pg_catalog.pg_proc p
          join pg_catalog.pg_language l on p.prolang = l.oid
          join pg_namespace on p.pronamespace = pg_namespace.oid
        where
          lanname in ('plpythonu', 'plpython2u') and
          nspname not in ('cartodb', 'cdb_dataservices_client', 'cdb_crankshaft') and
          (nspname = 'public' and proname not in ('cdb_invalidate_varnish', 'update_timestamp'))
      })

      raise "Can't migrate custom plpython2 functions" if pg_result.ntuples > 0
    end

    def check_valid_user(user)
      Carto::GhostTablesManager.new(user.id).link_ghost_tables_synchronously
    end

    def check_valid_organization(organization)
      organization.users.each do |user|
        check_valid_user(user)
      end
    end

    def run_metadata_export(meta_dir)
      if organization
        Carto::OrganizationMetadataExportService.new.export_to_directory(organization, meta_dir)
      elsif user
        Carto::UserMetadataExportService.new.export_to_directory(user, meta_dir)
      else
        raise 'Unrecognized export type for exporting metadata'
      end
    end

    def export_job_arguments(data_dir)
      args = if user.present?
               {
                 id: user.username,
                 schema_mode: false
               }
             else
               {
                 organization_name: organization.name,
                 schema_mode: true,
                 split_user_schemas: false
               }
             end

      args.merge(
        path: data_dir,
        job_uuid: id,
        export_job_logger: log.logger,
        logger: log.logger,
        metadata: false,
        data: export_data?
      )
    end

    def user_or_organization_present
      unless (user.present? && organization.blank?) || (organization.present? && user.blank?)
        errors.add(:user, 'exactly one user or organization required')
      end
    end

    def validate_export_data
      errors.add(:export_metadata, 'needs to be true if export_data is set to false') if !export_data? && !export_metadata?
    end

    def set_defaults
      self.log ||= Carto::Log.new_user_migration_export
      log.save

      self.state = STATE_PENDING unless state
      save
    end
  end
end

# encoding: UTF-8

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

    def run_export
      check_valid_user(user) if user && export_metadata
      check_valid_organization(organization) if organization && export_metadata

      log.append("=== Exporting #{organization ? 'user' : 'org'} data ===")
      update_attributes(state: STATE_EXPORTING)

      package = UserMigrationPackage.for_export(id, log)

      export_job = CartoDB::DataMover::ExportJob.new(export_job_arguments(package.data_dir))

      run_metadata_export(package.meta_dir) if export_metadata?

      log.append("=== Uploading #{id}/#{export_job.json_file} ===")
      update_attributes(state: STATE_UPLOADING, json_file: "#{id}/#{export_job.json_file}")
      uploaded_path = package.upload

      state = uploaded_path.present? ? STATE_COMPLETE : STATE_FAILURE
      log.append("=== Finishing. State: #{state}. File: #{uploaded_path} ===")
      update_attributes(state: state, exported_file: uploaded_path)

      true
    rescue => e
      log.append_exception('Exporting', exception: e)
      CartoDB::Logger.error(exception: e, message: 'Error exporting user data', job: inspect)
      update_attributes(state: STATE_FAILURE)

      false
    ensure
      package.try(:cleanup)
    end

    def enqueue
      Resque.enqueue(Resque::UserMigrationJobs::Export, export_id: id)
    end

    private

    def check_valid_user(user)
      unless Carto::GhostTablesManager.new(user.id).user_tables_synced_with_db?
        raise "Cannot export if tables aren't synched with db. Please run ghost tables."
      end

      vs = user.visualizations.where(type: Carto::Visualization::TYPE_CANONICAL).select { |v| v.table.nil? }
      raise "Can't export. Vizs without user table: #{vs.map(&:id)}" unless vs.empty?
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
        metadata: false
      )
    end

    def user_or_organization_present
      unless (user.present? && organization.blank?) || (organization.present? && user.blank?)
        errors.add(:user, 'exactly one user or organization required')
      end
    end

    def set_defaults
      self.log = Carto::Log.create(type: 'user_migration_export') unless log
      self.state = STATE_PENDING unless state
      save
    end
  end
end

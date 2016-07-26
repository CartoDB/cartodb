# encoding: UTF-8

require 'active_record'
require 'fileutils'
require_relative '../../../services/user-mover/export_user'
require_dependency 'file_upload'
require_dependency 'resque/user_migration_jobs'

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
      log.append('=== Exporting ===')
      update_attributes(state: STATE_EXPORTING)
      work_dir = create_work_directory

      log.append('=== Exporting user/org data ===')
      export_job = CartoDB::DataMover::ExportJob.new(export_job_arguments(work_dir))

      log.append('=== Uploading ===')
      update_attributes(state: STATE_UPLOADING, json_file: "#{id}/#{export_job.json_file}")
      package_path = compress_package(work_dir)
      uploaded_path = upload_package(package_path)

      state = uploaded_path.present? ? STATE_COMPLETE : STATE_FAILURE
      log.append("=== Finishing. State: #{state}. File: #{uploaded_path} ===")
      update_attributes(state: state, exported_file: uploaded_path)
      true
    rescue => e
      log.append_exception('Exporting', exception: e)
      CartoDB::Logger.error(exception: e, message: 'Error exporting user data', job: inspect)
      update_attributes(state: STATE_FAILURE)
      FileUtils.remove_dir(work_dir)
      false
    end

    def enqueue
      Resque.enqueue(Resque::UserMigrationJobs::Export, export_id: id)
    end

    private

    def create_work_directory
      log.append('=== Creating work directory ===')
      work_dir = "#{export_dir}/#{id}/"
      FileUtils.mkdir_p(work_dir)
      work_dir
    end

    def compress_package(work_dir)
      log.append('=== Compressing export ===')
      `cd #{export_dir}/ && zip -r \"user_export_#{id}.zip\" #{id} && cd -`
      FileUtils.remove_dir(work_dir)
      "#{export_dir}/user_export_#{id}.zip"
    end

    def upload_package(filepath)
      log.append('=== Uploading user data package ===')
      file = CartoDB::FileUploadFile.new(filepath)
      s3_config = Cartodb.config[:user_migrator]['s3'] || {}
      results = file_upload_helper.upload_file_to_storage(
        file_param: file,
        s3_config: s3_config,
        allow_spaces: true,
        force_s3_upload: true
      )

      export_path = if results[:file_path].present?
                      log.append("Ad-hoc export download: #{results[:file_path]}")
                      results[:file_path]
                    else
                      log.append("By file_upload_helper: #{results[:file_uri]}")
                      results[:file_uri]
                    end

      log.append('=== Deleting tmp file ===')
      FileUtils.rm(filepath)

      export_path
    end

    def file_upload_helper
      CartoDB::FileUpload.new(Cartodb.get_config(:user_migrator, "uploads_path"))
    end

    def export_dir
      Cartodb.get_config(:user_migrator, 'user_exports_folder')
    end

    def export_job_arguments(work_dir)
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
        path: work_dir,
        job_uuid: id,
        export_job_logger: log.logger,
        logger: log.logger
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

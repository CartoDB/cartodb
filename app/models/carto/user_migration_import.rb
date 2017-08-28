# encoding: UTF-8

require 'active_record'
require 'fileutils'
require_relative '../../../services/user-mover/import_user'
require_dependency 'resque/user_migration_jobs'

module Carto
  class UserMigrationImport < ::ActiveRecord::Base
    belongs_to :organization, class_name: Carto::Organization
    belongs_to :user, class_name: Carto::User
    belongs_to :log, class_name: Carto::Log

    STATE_PENDING = 'pending'.freeze
    STATE_DOWNLOADING = 'downloading'.freeze
    STATE_IMPORTING = 'importing'.freeze
    STATE_COMPLETE = 'complete'.freeze
    STATE_FAILURE = 'failure'.freeze
    VALID_STATES = [STATE_PENDING, STATE_DOWNLOADING, STATE_IMPORTING, STATE_COMPLETE, STATE_FAILURE].freeze

    after_initialize :set_defaults

    validates :state, inclusion: { in: VALID_STATES }
    validates :database_host, presence: true
    validates :exported_file, presence: true
    validates :json_file, presence: true
    validate :valid_import_type

    def run_import
      log.append('=== Downloading ===')
      update_attributes(state: STATE_DOWNLOADING)
      work_dir = create_work_directory
      package_file = download_package(work_dir)
      unzip_package(work_dir, package_file)
      log.append('=== Deleting zip package ===')
      FileUtils.rm(package_file)

      unpacked_dir = Dir["#{work_dir}/*"].first
      log.append('=== Importing ===')
      update_attributes(state: STATE_IMPORTING)

      meta_dir = meta_dir(unpacked_dir)
      data_dir = data_dir(unpacked_dir)

      service = case import_type
                when 'organization' then Carto::OrganizationMetadataExportService.new
                when 'user'         then Carto::UserMetadataExportService.new
                else raise 'Unrecognized import type'
                end
      import(service, meta_dir, data_dir)

      log.append('=== Complete ===')
      update_attributes(state: STATE_COMPLETE)
    rescue => e
      log.append_exception('Importing', exception: e)
      CartoDB::Logger.error(exception: e, message: 'Error importing user data', job: inspect)
      update_attributes(state: STATE_FAILURE)
      false
    ensure
      if work_dir
        log.append("Deleting tmp directory #{work_dir}")
        FileUtils.remove_dir(work_dir)
      end
    end

    def enqueue
      Resque.enqueue(Resque::UserMigrationJobs::Import, import_id: id)
    end

    private

    def valid_import_type
      case import_type
      when 'user'
        errors.add(:organization_id, "organization_id can't be present") if organization_id.present?
      when 'organization'
        errors.add(:user_id, "user_id can't be present") if user_id.present?
      else
        errors.add(:import_type, "Import type must be 'user' or 'organization'")
      end
    end

    def import(service, meta_dir, data_dir)
      if import_metadata?
        log.append('=== Importing metadata ===')
        imported = service.import_from_directory(meta_dir)
        save!
      end

      log.append('=== Importing data ===')
      CartoDB::DataMover::ImportJob.new(import_job_arguments(data_dir)).run!

      if import_metadata?
        log.append('=== Importing visualizations and search tweets ===')
        service.import_metadata_from_directory(imported, meta_dir)
      end
    end

    def unzip_package(work_dir, package)
      log.append("=== Unzipping #{package} ===")
      `cd #{work_dir}; unzip -u #{package}; cd -`
    end

    def create_work_directory
      log.append('=== Creating work directory ===')

      work_dir = "#{import_dir}/#{id}"
      FileUtils.mkdir_p(work_dir)

      work_dir
    end

    def download_package(work_dir)
      destination = "#{work_dir}/export.zip"

      log.append("=== Downloading #{exported_file} to #{destination} ===")

      if exported_file.starts_with?('http')
        http_client.get_file(exported_file, destination)
      else
        FileUtils.cp(exported_file, destination)
      end

      destination
    end

    def http_client
      Carto::Http::Client.get('user_imports')
    end

    def import_dir
      Cartodb.get_config(:user_migrator, 'user_imports_folder')
    end

    def import_only_data?
      # If the destination user/org already exists, import only data (same cloud, different DBs)
      org_import? ? organization.present? : user.present?
    end

    def import_into
      organization if !org_import?
    end

    def import_job_arguments(data_dir)
      export_file = json_file.split('/').last

      {
        job_uuid: id,
        file: "#{data_dir}/#{export_file}",
        data: true,
        metadata: false,
        host: database_host,
        rollback: false,
        into_org_name: nil,
        mode: :import,
        logger: log.logger,
        import_job_logger: log.logger
      }
    end

    def set_defaults
      self.log = Carto::Log.create(type: 'user_migration_import') unless log
      self.state = STATE_PENDING unless state

      save
    end

    def data_dir(work_dir)
      "#{work_dir}/data"
    end

    def meta_dir(work_dir)
      "#{work_dir}/meta"
    end
  end
end

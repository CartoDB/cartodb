# encoding: UTF-8

require 'active_record'
require 'fileutils'
require_dependency 'services/user-mover/export_user'
require_dependency 'file_upload'

module Carto
  class UserMigrationImport < ::ActiveRecord::Base
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

    def run_import

    end

    private

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

    def import_job_arguments
      {
        job_uuid: id,
        file: "#{import_dir}/#{json_file}",
        data: true,
        metadata: !import_only_data?,
        host: database_host,
        rollback: false,
        into_org_name: import_into.try(:name),
        mode: :import
      }
    end

    def set_defaults
      self.log = Carto::Log.create(type: 'user_migration_export') unless log
      self.state = STATE_PENDING unless state
      save
    end
  end
end

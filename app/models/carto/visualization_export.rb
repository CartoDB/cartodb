# encoding: UTF-8

require 'fileutils'
require 'active_record'
require_relative '../../services/carto/visualizations_export_service_2'
require_relative '../../../services/sql-api/sql_api'
require_relative './visualization'
require_dependency 'carto/visualization_exporter'

module Carto
  class VisualizationExport < ::ActiveRecord::Base
    include VisualizationExporter
    belongs_to :visualization, class_name: Carto::Visualization
    belongs_to :user, class_name: Carto::User
    belongs_to :log, class_name: Carto::Log

    validate :visualization_exportable_by_user?, if: :new_record?
    validate :user_tables_ids_valid?, if: :new_record?

    STATE_PENDING = 'pending'.freeze
    STATE_EXPORTING = 'exporting'.freeze
    STATE_UPLOADING = 'uploading'.freeze
    STATE_COMPLETE = 'complete'.freeze
    STATE_FAILURE = 'failure'.freeze

    def exporter_folder
      ensure_folder(exporter_config['exporter_temporal_folder'] || DEFAULT_EXPORTER_TMP_FOLDER)
    end

    def run_export!(file_upload_helper: default_file_upload_helper)
      logger = Carto::Log.new(type: 'visualization_export')

      logger.append('Exporting')
      update_attributes(state: STATE_EXPORTING, log: logger)
      filepath = export(visualization, user, user_tables_ids: user_tables_ids)

      logger.append('Uploading')
      update_attributes(state: STATE_UPLOADING, file: filepath)
      upload_params = { file: CartoDB::FileUploadFile.new(filepath) }
      results = file_upload_helper.upload_file_to_storage(upload_params, nil, Cartodb.config[:exporter]['s3'])
      url = results[:file_uri]

      logger.append('Deleting tmp file')
      FileUtils.rm(filepath)

      logger.append('Finishing')
      state = filepath.present? && url.present? ? STATE_COMPLETE : STATE_FAILURE
      update_attributes(state: state, file: filepath, url: url)
      true
    rescue => e
      logger.append_exception('Exporting', exception: e)
      CartoDB::Logger.error(
        exception: e,
        message: "Visualization export error",
        user: user,
        visualization_id: visualization.id,
        visualization_export_id: id)
      update_attributes(state: STATE_FAILURE)

      false
    end

    private

    def default_file_upload_helper
      CartoDB::FileUpload.new(Cartodb.get_config(:exporter, "uploads_path"))
    end

    def visualization_exportable_by_user?
      errors.add(:visualization, 'Must be accessible by the user') unless visualization.is_accesible_by_user?(user)
    end

    def user_tables_ids_valid?
      return unless user_tables_ids.present?
      related_tables_ids = visualization.related_tables_readable_by(user).map(&:id)
      not_valid = user_tables_ids.split(',').select { |user_table_id| !related_tables_ids.include?(user_table_id) }
      not_valid.each do |user_table_id|
        errors.add(:user_tables_ids, "User table #{user_table_id} is not related to visualization #{visualization.id}")
      end
    end

  end
end

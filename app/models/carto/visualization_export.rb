require 'uri'
require 'fileutils'
require 'active_record'
require_relative '../../services/carto/visualizations_export_service_2'
require_relative '../../../services/sql-api/sql_api'
require_relative './visualization'
require_dependency 'carto/visualization_exporter'

module Carto
  class VisualizationExport < ::ActiveRecord::Base
    include VisualizationExporter
    include Carto::VisualizationsExportService2Validator

    belongs_to :visualization, class_name: Carto::Visualization
    belongs_to :user, class_name: Carto::User
    belongs_to :log, class_name: Carto::Log

    validate :visualization_exportable_by_user?, if: :new_record?
    validate :user_tables_ids_valid?, if: :new_record?
    validate :valid_visualization_type?, if: :new_record?

    STATE_PENDING = 'pending'.freeze
    STATE_EXPORTING = 'exporting'.freeze
    STATE_UPLOADING = 'uploading'.freeze
    STATE_COMPLETE = 'complete'.freeze
    STATE_FAILURE = 'failure'.freeze

    def exporter_folder
      ensure_folder(exporter_config['exporter_temporal_folder'] || DEFAULT_EXPORTER_TMP_FOLDER)
    end

    def run_export!(file_upload_helper: default_file_upload_helper, download_path: nil)
      logger = Carto::Log.new_visualization_export

      logger.append('Exporting')
      update_attributes(state: STATE_EXPORTING, log: logger)
      filepath = export(visualization, user, user_tables_ids: user_tables_ids)

      logger.append('Uploading')
      update_attributes(state: STATE_UPLOADING, file: filepath)

      file = CartoDB::FileUploadFile.new(filepath)

      s3_config = Cartodb.get_config(:exporter, 's3').deep_dup || {}

      plain_name = header_encode(file.original_filename.force_encoding('iso-8859-1'))
      utf_name = header_encode(file.original_filename)
      s3_config['content-disposition'] = %{attachment;filename="#{plain_name}";filename*=utf-8''#{utf_name}}

      results = file_upload_helper.upload_file_to_storage(
        file_param: file,
        s3_config: s3_config,
        allow_spaces: true,
        force_s3_upload: true
      )

      if results[:file_uri].present?
        logger.append("By file_upload_helper: #{results[:file_uri]}, #{filepath}, (ignored: #{results[:file_path]})")
        export_url = results[:file_uri]
        export_file = filepath
      else
        logger.append("Ad-hoc export download: #{results[:file_path]} (ignored: #{filepath})")
        export_url = download_path
        export_file = results[:file_path]
      end

      logger.append('Deleting tmp file')
      FileUtils.rm(filepath)

      state = export_url.present? && export_file.present? ? STATE_COMPLETE : STATE_FAILURE
      logger.append("Finishing. State: #{state}. File: #{export_file}. URL: #{url}")
      update_attributes(state: state, file: export_file, url: export_url)
      true
    rescue StandardError => e
      logger.append_exception('Exporting', exception: e)
      log_error(
        exception: e,
        message: "Visualization export error",
        current_user: user,
        visualization: visualization.attributes.slice(:id),
        visualization_export: attributes.slice(:id)
      )
      update_attributes(state: STATE_FAILURE)

      false
    end

    private

    def header_encode(name)
      URI.encode(name, /[^#{URI::PATTERN::UNRESERVED}]/)
    end

    def default_file_upload_helper
      CartoDB::FileUpload.new(Cartodb.get_config(:exporter, "uploads_path"))
    end

    def visualization_exportable_by_user?
      errors.add(:user, 'Must be able to view the visualization') unless visualization.is_viewable_by_user?(user)
    end

    def user_tables_ids_valid?
      return unless user_tables_ids.present?
      related_tables_ids = visualization.related_tables_readable_by(user).map(&:id)
      not_valid = user_tables_ids.split(',').select { |user_table_id| !related_tables_ids.include?(user_table_id) }
      not_valid.each do |user_table_id|
        errors.add(:user_tables_ids, "User table #{user_table_id} is not related to visualization #{visualization.id}")
      end
    end

    def valid_visualization_type?
      errors.add(:visualization, 'Only derived visualizations can be exported') unless visualization.derived?
    end
  end
end

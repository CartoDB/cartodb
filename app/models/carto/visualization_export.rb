# encoding: UTF-8

require 'fileutils'
require 'active_record'
require_relative '../../services/carto/visualizations_export_service_2'
require_relative '../../../services/sql-api/sql_api'
require_relative './visualization'
require_dependency 'carto/visualization_exporter'

module Carto
  class DataExporter
    def initialize(http_client = Carto::Http::Client.get('data_exporter', log_requests: true))
      @http_client = http_client
    end

    # Returns the file
    def export_table(user_table, folder, format)
      table_name = user_table.name

      query = %{select * from "#{table_name}"}
      url = sql_api_query_url(query, table_name, user_table.user, privacy(user_table), format)
      exported_file = "#{folder}/#{table_name}.#{format}"
      @http_client.get_file(url, exported_file)
    end

    def export_visualization_tables(visualization, user, dir, format)
      visualization.related_tables_readable_by(user).map { |ut| export_table(ut, dir, format) }
    end

    private

    def sql_api_query_url(query, filename, user, privacy, format)
      CartoDB::SQLApi.with_user(user, privacy).url(query, format, filename)
    end

    def privacy(user_table)
      user_table.private? ? 'private' : 'public'
    end
  end

  class VisualizationExport < ::ActiveRecord::Base
    include VisualizationExporter
    # TODO: FKs? convenient?
    belongs_to :visualization, class_name: Carto::Visualization
    belongs_to :user, class_name: Carto::User
    belongs_to :log, class_name: Carto::Log

    validate :visualization_exportable_by_user?, if: :new_record?

    STATE_PENDING = 'pending'.freeze
    STATE_EXPORTING = 'exporting'.freeze
    STATE_UPLOADING = 'uploading'.freeze
    STATE_COMPLETE = 'complete'.freeze
    STATE_FAILURE = 'failure'.freeze

    def run_export!(file_upload_helper: default_file_upload_helper)
      logger = Carto::Log.new(type: 'visualization_export')

      logger.append('Exporting')
      update_attributes(state: STATE_EXPORTING, log: logger)
      filepath = export(visualization, user)

      logger.append('Uploading')
      update_attributes(state: STATE_UPLOADING, file: filepath)
      results = file_upload_helper.upload_file_to_storage({ file: CartoDB::FileUploadFile.new(filepath) }, nil, Cartodb.config[:exporter]['s3'])
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
      false
    end

    private

    def default_file_upload_helper
      CartoDB::FileUpload.new(Cartodb.get_config(:exporter, "uploads_path"))
    end

    def visualization_exportable_by_user?
      errors.add(:visualization, 'Must be accessible by the user') unless visualization.is_accesible_by_user?(user)
    end

  end
end

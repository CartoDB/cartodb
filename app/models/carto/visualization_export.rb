# encoding: UTF-8

require 'fileutils'

module Carto
  module ExporterConfig
    DEFAULT_EXPORTER_TMP_FOLDER = '/tmp/exporter/'.freeze

    def exporter_config
      (Cartodb.config[:exporter] || {}).deep_symbolize_keys
    end

    def exporter_folder
      ensure_folder(exporter_config[:exporter_temporal_folder] || DEFAULT_EXPORTER_TMP_FOLDER)
    end

    def ensure_folder(folder)
      Dir.mkdir(folder) unless Dir.exists?(folder)
      folder
    end

    def ensure_clean_folder(folder)
      FileUtils.remove_dir(folder) if Dir.exists?(folder)
      ensure_folder(folder)
    end
  end

  class DataExporter
    include ApplicationHelper

    # Returns the file
    def export_table(user_table, folder, format)
      table_name = user_table.name

      query = %{select * from "#{table_name}"}
      url = sql_api_query_url(query, table_name, user_table.user, privacy(user_table), format)
      exported_file = "#{folder}/#{table_name}.#{format}"
      Carto::Http::Client.get('data_exporter', log_requests: true).get_file(url, exported_file)
    end

    private

    def sql_api_query_url(query, filename, user, privacy, format)
      CartoDB::SQLApi.with_user(user, privacy).url(query, format, filename)
    end

    def privacy(user_table)
      user_table.private? ? 'private' : 'public'
    end
  end

  module VisualizationExporter
    include ExporterConfig

    def export(visualization, user, format = 'shp')
      visualization_id = visualization.id

      run_dir = ensure_clean_folder("#{exporter_folder}/#{visualization_id}")
      export_dir = ensure_clean_folder("#{run_dir}/#{visualization_id}")

      data_exporter = DataExporter.new
      files = visualization.related_tables.map { |ut| data_exporter.export_table(ut, export_dir, format) }
      visualization_json = Carto::VisualizationsExportService2.new.export_visualization_json_string(visualization_id, user)
      visualization_json_file = "#{export_dir}/#{visualization_id}.json"
      File.open(visualization_json_file, 'w') { |file| file.write(visualization_json) }
      files << visualization_json_file

      zipfile = "#{visualization_id}.carto"
      `cd #{run_dir} && zip -r "#{zipfile}" "#{visualization_id} && cd -"`

      zipfile
    end
  end

  class VisualizationExport
    include VisualizationExporter

  end
end

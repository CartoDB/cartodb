# encoding: UTF-8

require 'fileutils'
require_relative '../../services/carto/visualizations_export_service_2'
require_relative '../../../services/sql-api/sql_api'

module Carto
  module ExporterConfig
    DEFAULT_EXPORTER_TMP_FOLDER = '/tmp/exporter'.freeze

    def exporter_config
      (Cartodb.config[:exporter] || {}).deep_symbolize_keys
    end

    def exporter_folder
      ensure_folder(exporter_config['exporter_temporal_folder'] || DEFAULT_EXPORTER_TMP_FOLDER)
    end

    def export_dir(visualization, base_dir: exporter_folder)
      ensure_folder("#{base_dir}/#{visualization.id}_#{String.random(10).downcase}")
    end

    # Example `parent_dir`: `export_dir(visualization, base_dir: base_dir)`
    def tmp_dir(visualization, parent_dir:)
      ensure_folder("#{parent_dir}/#{visualization.id}")
    end

    def ensure_folder(folder)
      FileUtils.mkdir_p(folder) unless Dir.exists?(folder)
      folder
    end

    def ensure_clean_folder(folder)
      FileUtils.remove_dir(folder) if Dir.exists?(folder)
      ensure_folder(folder)
    end
  end

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

  module VisualizationExporter
    include ExporterConfig
    EXPORT_EXTENSION = '.carto.json'.freeze

    VISUALIZATION_EXTENSIONS = [Carto::VisualizationExporter::EXPORT_EXTENSION].freeze

    def self.has_visualization_extension?(filename)
      VISUALIZATION_EXTENSIONS.any? { |extension| filename =~ /#{extension}$/ }
    end

    def export(visualization, user,
               format: 'csv',
               data_exporter: DataExporter.new,
               visualization_export_service: Carto::VisualizationsExportService2.new,
               base_dir: exporter_folder)
      visualization_id = visualization.id
      export_dir = export_dir(visualization, base_dir: base_dir)
      tmp_dir = tmp_dir(visualization, parent_dir: export_dir)
      ensure_clean_folder(tmp_dir)

      data_exporter.export_visualization_tables(visualization, user, tmp_dir, format)
      visualization_json = visualization_export_service.export_visualization_json_string(visualization_id, user)
      visualization_json_file = "#{tmp_dir}/#{visualization_id}#{EXPORT_EXTENSION}"
      File.open(visualization_json_file, 'w') { |file| file.write(visualization_json) }

      zipfile = "#{visualization_id}.carto"
      `cd #{export_dir}/ && zip -r #{zipfile} #{visualization_id} && cd -`

      FileUtils.remove_dir(tmp_dir)

      "#{export_dir}/#{zipfile}"
    end
  end

  class VisualizationExport
    include VisualizationExporter

  end
end

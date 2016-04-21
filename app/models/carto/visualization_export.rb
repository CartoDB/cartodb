# encoding: UTF-8

require 'fileutils'

module Carto
  class DataExporter
    include ApplicationHelper

    # Returns the file
    # TODO: verify files location!!!
    def export_table(user_table, format)
      table_name = user_table.name

      query = %{select * from "#{table_name}"}
      url = sql_api_query_url(query, table_name, user_table.user, privacy(user_table), format)
      file = Carto::Http::Client.get('data_exporter', log_requests: true).get_file(url)

      filename = "#{table_name}.#{format}"
      directory = user_table.id
      Dir.mkdir(directory) unless Dir.exists?(directory)
      target_path = "#{directory}/#{filename}"
      FileUtils.mv(file.path, target_path)

      target_path
    end

    private

    def sql_api_query_url(query, filename, user, privacy, format)
      CartoDB::SQLApi.new(
        base_url: sql_api_url(user.username, privacy),
        protocol: 'https',
        username: user.username,
        api_key: user.api_key
      ).url(query, format, filename)
    end

    def privacy(user_table)
      user_table.private? ? 'private' : 'public'
    end
  end

  module VisualizationExporter
    def export(visualization, user, format = 'shp')
      visualization_id = visualization.id

      data_exporter = DataExporter.new
      files = visualization.related_tables.map { |ut| data_exporter.export_table(ut, format) }
      visualization_json = Carto::VisualizationsExportService2.new.export_visualization_json_string(visualization.id, user)
      visualization_json_file = "#{visualization_id}.json"
      File.open(visualization_json_file, 'w') { |file| file.write(visualization_json) }
      files << visualization_json_file

      FileUtils.remove_dir(visualization_id) if Dir.exists?(visualization_id)
      Dir.mkdir(visualization_id)
      files.each { |path| FileUtils.mv(path, "#{visualization_id}/") }

      zipfile = "#{visualization_id}.carto"
      `zip -r "#{zipfile}" "#{visualization_id}"`

      zipfile
    end
  end

  class VisualizationExport
    include VisualizationExporter

  end
end

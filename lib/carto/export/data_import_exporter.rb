module Carto
  module DataImportExporterConfiguration
    EXPORTED_DATA_IMPORT_ATTRIBUTES = [
      :data_source, :data_type, :table_name, :state, :success, :updated_at, :created_at, :error_code, :queue_id,
      :tables_created_count, :table_names, :append, :migrate_table, :table_copy, :from_query, :id, :service_name,
      :service_item_id, :stats, :type_guessing, :quoted_fields_guessing, :content_guessing, :host, :collision_strategy,
      :upload_host, :resque_ppid, :create_visualization, :visualization_id, :user_defined_limits, :import_extra_options,
      :original_url, :privacy, :cartodbfy_time, :http_response_code, :rejected_layers, :runner_warnings, :server
    ].freeze

    MAX_LOG_SIZE = 8192
  end

  module DataImportImporter
    include DataImportExporterConfiguration

    private

    def build_data_import_from_hash(exported_data_import)
      return nil unless exported_data_import

      di = DataImport.new(exported_data_import.slice(*EXPORTED_DATA_IMPORT_ATTRIBUTES).except(:id))

      di.log = build_log_from_hash(exported_data_import[:log])
      di.external_data_imports = exported_data_import[:external_data_imports].map do |edi|
        build_external_data_import_from_hash(edi)
      end

      di.id = exported_data_import[:id]
      di
    end

    def build_external_data_import_from_hash(exported_external_data_import)
      Carto::ExternalDataImport.new(external_source_id: exported_external_data_import[:external_source_id])
    end

    def build_log_from_hash(exported_log)
      return nil unless exported_log

      Carto::Log.new(type: exported_log[:type], entries: exported_log[:entries])
    end
  end

  module DataImportExporter
    include DataImportExporterConfiguration

    private

    def export_data_import(data_import)
      return nil unless data_import

      data_import_hash = EXPORTED_DATA_IMPORT_ATTRIBUTES.map { |att| [att, data_import.attributes[att.to_s]] }.to_h
      data_import_hash[:log] = export_log(data_import.log)
      data_import_hash[:external_data_imports] = data_import.external_data_imports.map do |edi|
        export_external_data_import(edi)
      end

      data_import_hash
    end

    def export_external_data_import(external_data_import)
      {
        external_source_id: external_data_import.external_source_id
      }
    end

    def export_log(log)
      return nil unless log

      {
        type: log.type,
        entries: log.entries && log.entries.length > MAX_LOG_SIZE ? log.entries.slice(-MAX_LOG_SIZE..-1) : log.entries
      }
    end
  end
end

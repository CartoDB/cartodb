module Carto
  module DataImportImporter
    private

    def build_data_import_from_hash(exported_data_import)
      return nil unless exported_data_import

      di = Carto::DataImport.new(
        data_source: exported_data_import[:data_source],
        data_type: exported_data_import[:data_type],
        table_name: exported_data_import[:table_name],
        state: exported_data_import[:state],
        success: exported_data_import[:success],
        log: build_log_from_hash(exported_data_import[:log]),
        updated_at: exported_data_import[:updated_at],
        created_at: exported_data_import[:created_at],
        error_code: exported_data_import[:error_code],
        queue_id: exported_data_import[:queue_id],
        tables_created_count: exported_data_import[:tables_created_count],
        table_names: exported_data_import[:table_names],
        append: exported_data_import[:append],
        migrate_table: exported_data_import[:migrate_table],
        table_copy: exported_data_import[:table_copy],
        from_query: exported_data_import[:from_query],
        service_name: exported_data_import[:service_name],
        service_item_id: exported_data_import[:service_item_id],
        stats: exported_data_import[:stats],
        type_guessing: exported_data_import[:type_guessing],
        quoted_fields_guessing: exported_data_import[:quoted_fields_guessing],
        content_guessing: exported_data_import[:content_guessing],
        server: exported_data_import[:server],
        host: exported_data_import[:host],
        upload_host: exported_data_import[:upload_host],
        resque_ppid: exported_data_import[:resque_ppid],
        create_visualization: exported_data_import[:create_visualization],
        visualization_id: exported_data_import[:visualization_id],
        user_defined_limits: exported_data_import[:user_defined_limits],
        import_extra_options: exported_data_import[:import_extra_options],
        original_url: exported_data_import[:original_url],
        privacy: exported_data_import[:privacy],
        cartodbfy_time: exported_data_import[:cartodbfy_time],
        http_response_code: exported_data_import[:http_response_code],
        rejected_layers: exported_data_import[:rejected_layers],
        runner_warnings: exported_data_import[:runner_warnings],
        collision_strategy: exported_data_import[:collision_strategy],
        external_data_imports: exported_data_import[:external_data_imports].map { |edi| build_external_data_import_from_hash(edi) }
      )

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
    MAX_LOG_SIZE = 8192

    private

    def export_data_import(data_import)
      return nil unless data_import

      {
        data_source: data_import.data_source,
        data_type: data_import.data_type,
        table_name: data_import.table_name,
        state: data_import.state,
        success: data_import.success,
        log: export_log(data_import.log),
        updated_at: data_import.updated_at,
        created_at: data_import.created_at,
        error_code: data_import.error_code,
        queue_id: data_import.queue_id,
        tables_created_count: data_import.tables_created_count,
        table_names: data_import.table_names,
        append: data_import.append,
        migrate_table: data_import.migrate_table,
        table_copy: data_import.table_copy,
        from_query: data_import.from_query,
        id: data_import.id,
        service_name: data_import.service_name,
        service_item_id: data_import.service_item_id,
        stats: data_import.stats,
        type_guessing: data_import.type_guessing,
        quoted_fields_guessing: data_import.quoted_fields_guessing,
        content_guessing: data_import.content_guessing,
        server: data_import.server,
        host: data_import.host,
        upload_host: data_import.upload_host,
        resque_ppid: data_import.resque_ppid,
        create_visualization: data_import.create_visualization,
        visualization_id: data_import.visualization_id,
        user_defined_limits: data_import.user_defined_limits,
        import_extra_options: data_import.import_extra_options,
        original_url: data_import.original_url,
        privacy: data_import.privacy,
        cartodbfy_time: data_import.cartodbfy_time,
        http_response_code: data_import.http_response_code,
        rejected_layers: data_import.rejected_layers,
        runner_warnings: data_import.runner_warnings,
        collision_strategy: data_import.collision_strategy,
        external_data_imports: data_import.external_data_imports.map { |edi| export_external_data_import(edi) }
      }
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

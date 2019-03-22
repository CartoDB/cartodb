require_dependency 'carto/visualizations_export_service_2'

module Carto
  module VisualizationBackupService
    include Carto::VisualizationsExportService2Exporter
    include Carto::VisualizationsExportService2Importer

    def create_visualization_backup(visualization:, category:, with_mapcaps: true, with_password: true)
      export_json = export_visualization_json_hash(
        visualization.id,
        visualization.user,
        with_mapcaps: with_mapcaps,
        with_password: with_password
      )
      Carto::VisualizationBackup.create!(
        user_id: visualization.user.id,
        visualization_id: visualization.id,
        category: category,
        export: export_json
      )
    rescue StandardError => exception
      # The backup should not break the flow
      CartoDB::Logger.error(
        message: 'Error creating a visualization backup',
        exception: exception,
        visualization: visualization
      )
    end

    def restore_visualization_backup(visualization_backup_id)
      backup = Carto::VisualizationBackup.find(visualization_backup_id)
      raise 'A visualization with the same id as the backup one already exists' if Carto::Visualization.find(backup.visualization_id)
      user = Carto::User.find(backup.user_id)
      visualization_json = build_visualization_from_hash_export(backup.export)
      Carto::VisualizationsExportPersistenceService.new.save_import(user, visualization_json, full_restore: true)
    end
  end
end

require_dependency 'carto/visualizations_export_service_2'

module Carto
  module VisualizationBackupService
    include Carto::VisualizationsExportService2Exporter
    include Carto::VisualizationsExportService2Importer

    def create_visualization_backup(visualization_id, user, category, with_mapcaps: true, with_password: true)
      export_json = export_visualization_json_hash(
        visualization_id,
        user,
        with_mapcaps: with_mapcaps,
        with_password: with_password
      )
      Carto::VisualizationBackup.create!(
        user_id: user.id,
        visualization_id: visualization_id,
        category: category,
        export: export_json
      )
    rescue StandardError => exception
      # The backup should not break the flow
      CartoDB::Logger.error(
        message: 'Error creating a visualization backup',
        exception: exception,
        visualization_id: visualization_id
      )
    end

    def restore_visualization_backup(visualization_backup_id)
      visualization_backup = Carto::VisualizationBackup.find(visualization_backup_id)
      user = Carto::User.find(visualization_backup.user_id)
      visualization_json = build_visualization_from_json_export(JSON.dump(visualization_backup.export))
      Carto::VisualizationsExportPersistenceService.new.save_import(user, visualization_json, full_restore:true)
    rescue StandardError => exception
      # The backup should not break the flow
      CartoDB::Logger.error(
        message: 'Error restoring a visualization backup',
        exception: exception,
        visualization_backup_id: visualization_backup_id
      )
    end
  end
end

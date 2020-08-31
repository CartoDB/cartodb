require_relative './base_job'

module Resque
  class UserMigrationJobs < BaseJob
    module Export
      extend ::LoggerHelper

      @queue = :user_migrations

      def self.perform(options = {})
        export = Carto::UserMigrationExport.find(options['export_id'])
        export.run_export
      rescue StandardError => e
        log_error(exception: e, message: 'Error exporting user data', export: export.attributes)
        raise e
      end
    end

    module Import
      extend ::LoggerHelper

      @queue = :user_migrations

      def self.perform(options = {})
        import = Carto::UserMigrationImport.find(options['import_id'])
        import.run_import
      rescue StandardError => e
        log_error(exception: e, message: 'Error importing user data', import: import.attributes)
        raise e
      end
    end
  end
end

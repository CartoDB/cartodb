# encoding: utf-8
require_relative './base_job'

module Resque
  class UserMigrationJobs < BaseJob
    module Export
      @queue = :user_migrations

      def self.perform(options = {})
        Carto::UserMigrationExport.find(options['export_id']).run_export
      rescue => e
        CartoDB::Logger.error(exception: e, message: 'Error exporting user data', export_id: options['export_id'])
        raise e
      end
    end

    module Import
      @queue = :user_migrations

      def self.perform(options = {})
        Carto::UserMigrationImport.find(options['import_id']).run_import
      rescue => e
        CartoDB::Logger.error(exception: e, message: 'Error importing user data', import_id: options['import_id'])
        raise e
      end
    end
  end
end

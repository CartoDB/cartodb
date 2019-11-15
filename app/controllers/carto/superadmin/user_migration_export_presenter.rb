module Carto
  module Superadmin
    class UserMigrationExportPresenter

      def initialize(user_migration_export)
        @user_migration_export = user_migration_export
      end

      def to_poro
        {
          id: @user_migration_export.id,
          state: @user_migration_export.state,
          exported_file: @user_migration_export.exported_file,
          json_file: @user_migration_export.json_file,
          log: @user_migration_export.log.entries
        }
      end

    end
  end
end

# encoding: utf-8

module Carto
  module Superadmin
    class UserMigrationImportPresenter

      def initialize(user_migration_import)
        @user_migration_import = user_migration_import
      end

      def to_poro
        {
          id: @user_migration_import.id,
          state: @user_migration_import.state,
          log: @user_migration_import.log.entries
        }
      end

    end
  end
end

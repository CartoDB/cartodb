require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    alter_table(:connections) do
      add_foreign_key :organization_id, :organizations, type: :uuid, null: true, index: true, on_delete: :cascade
      set_column_allow_null :user_id
    end
  end,
  Proc.new do
    # TODO: this is convenient for development, but better make the migration irreversible when in production
    run 'DELETE FROM connections WHERE user_id IS NULL'
    alter_table(:connections) do
      drop_column :organization_id
      set_column_not_null :user_id
    end
  end
)

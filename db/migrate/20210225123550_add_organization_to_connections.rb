require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    alter_table(:connections) do
      add_foreign_key :organization_id, :organizations, type: :uuid, null: true, index: true, on_delete: :cascade
      set_column_allow_null :user_id
      add_column :global_name, String, index: true, unique: true
    end
    run %{
      UPDATE connections
        SET global_name = users.username || '#{Carto::Connection::GLOBAL_NAME_SEPARATOR}' || connections.name
        FROM users WHERE users.id = connections.user_id;
    }
  end,
  Proc.new do
    alter_table(:connections) do
      drop_column :organization_id
      set_column_not_null :user_id
      drop_column :global_name
    end
  end
)

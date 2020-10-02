require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    alter_table :assets do
      add_foreign_key :organization_id,
                      :organizations,
                      type: 'uuid'

      add_index :organization_id

      add_column :storage_info, :json
    end
  end,
  proc do
    alter_table :assets do
      drop_column :organization_id
      drop_column :storage_info
    end
  end
)

require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    alter_table :api_keys do
      drop_index :db_role
      add_index [:user_id, :db_role], unique: true

      drop_index :token
      add_index [:user_id, :token], unique: true
    end
  end,
  Proc.new do
    alter_table :api_keys do
      drop_index [:user_id, :db_role]
      add_index :db_role, unique: true

      drop_index [:user_id, :token]
      add_index :token, unique: true
    end
  end
)

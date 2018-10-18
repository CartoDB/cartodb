require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    alter_table :api_keys do
      drop_index :user_id
      add_index [:user_id, :name], unique: true
    end
  end,
  Proc.new do
    alter_table :api_keys do
      drop_index [:user_id, :name]
      add_index :user_id
    end
  end
)

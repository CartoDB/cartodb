require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    alter_table :api_keys do
      add_index [:name, :user_id], unique: true
    end
  end,
  Proc.new do
    alter_table :api_keys do
      drop_index [:name, :user_id]
    end
  end
)

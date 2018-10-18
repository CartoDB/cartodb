require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    alter_table :users do
      add_foreign_key :rate_limit_id,
                      :rate_limits,
                      type: 'uuid'
      add_index :rate_limit_id
    end
  end,
  Proc.new do
    alter_table :users do
      drop_column :rate_limit_id
    end
  end
)

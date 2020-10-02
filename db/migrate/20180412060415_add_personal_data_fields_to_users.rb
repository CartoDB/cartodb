require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    add_column :users, :company, String
    add_column :users, :phone, String
    add_column :users, :industry, String
    add_column :users, :job_role, String
  end,
  proc do
    drop_column :users, :company
    drop_column :users, :phone
    drop_column :users, :industry
    drop_column :users, :job_role
  end
)

require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :users, :company, String
    add_column :users, :phone, String
    add_column :users, :industry, String
  end,
  Proc.new do
    drop_column :users, :company
    drop_column :users, :phone
    drop_column :users, :industry
  end
)

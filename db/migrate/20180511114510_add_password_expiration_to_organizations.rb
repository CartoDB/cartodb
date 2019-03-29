require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :organizations, :password_expiration_in_d, :integer
  end,
  Proc.new do
    drop_column :organizations, :password_expiration_in_d
  end
)

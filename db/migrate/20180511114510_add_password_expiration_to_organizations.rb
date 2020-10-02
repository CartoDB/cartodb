require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    add_column :organizations, :password_expiration_in_d, :integer
  end,
  proc do
    drop_column :organizations, :password_expiration_in_d
  end
)

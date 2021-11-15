require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :organizations, :random_saml_username, :bool, default: false
  end,
  Proc.new do
    drop_column :organizations, :random_saml_username
  end
)

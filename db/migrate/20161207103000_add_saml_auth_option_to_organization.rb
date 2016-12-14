require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    alter_table :organizations do
      add_column :auth_saml_enabled, :boolean, null: false, default: false
    end
  end,
  Proc.new do
    drop_column :organizations, :auth_saml_enabled
  end
)

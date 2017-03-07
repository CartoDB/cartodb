require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

NO_REMOVE_LOGO_PLANS_REGEXP = '^(FREE|MAGELLAN|JOHN SNOW|ACADEMY|ACADEMIC|ON HOLD|SITE LICENSE|CARTO FOR)'.freeze

migration(
  Proc.new do
    add_column :users, :no_map_logo, :boolean
    run "UPDATE users SET no_map_logo = (account_type !~* '#{NO_REMOVE_LOGO_PLANS_REGEXP}');"
    run 'ALTER TABLE users ALTER no_map_logo SET DEFAULT false, ALTER no_map_logo SET NOT NULL'

    add_column :organizations, :no_map_logo, :boolean
    run 'UPDATE organizations SET no_map_logo =
           COALESCE((SELECT no_map_logo FROM users WHERE id = organizations.owner_id), false)'
    run 'ALTER TABLE organizations ALTER no_map_logo SET DEFAULT false, ALTER no_map_logo SET NOT NULL'
  end,
  Proc.new do
    drop_column :users, :no_map_logo
    drop_column :organizations, :no_map_logo
  end
)

Sequel.migration do
  up do
    add_column :organizations, :here_maps_enabled, :boolean
    add_column :organizations, :stamen_maps_enabled, :boolean

    add_column :users, :here_maps_enabled, :boolean
    add_column :users, :stamen_maps_enabled, :boolean
  end

  down do
    Rails::Sequel::connection.run 'ALTER TABLE organizations DROP COLUMN IF EXISTS here_maps_enabled'
    Rails::Sequel::connection.run 'ALTER TABLE organizations DROP COLUMN IF EXISTS stamen_maps_enabled'
    Rails::Sequel::connection.run 'ALTER TABLE users DROP COLUMN IF EXISTS here_maps_enabled'
    Rails::Sequel::connection.run 'ALTER TABLE users DROP COLUMN IF EXISTS stamen_maps_enabled'
  end
end

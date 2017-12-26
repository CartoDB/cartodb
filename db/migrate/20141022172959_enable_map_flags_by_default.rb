Sequel.migration do
  up do

    SequelRails::connection.run 'ALTER TABLE organizations DROP COLUMN IF EXISTS here_maps_enabled'
    SequelRails::connection.run 'ALTER TABLE organizations DROP COLUMN IF EXISTS stamen_maps_enabled'
    SequelRails::connection.run 'ALTER TABLE users DROP COLUMN IF EXISTS here_maps_enabled'
    SequelRails::connection.run 'ALTER TABLE users DROP COLUMN IF EXISTS stamen_maps_enabled'

    add_column :organizations, :here_maps_enabled, :boolean, default: true
    add_column :organizations, :stamen_maps_enabled, :boolean, default: true

    add_column :users, :here_maps_enabled, :boolean, default: true
    add_column :users, :stamen_maps_enabled, :boolean, default: true
  end

  down do
    SequelRails::connection.run 'ALTER TABLE organizations DROP COLUMN IF EXISTS here_maps_enabled'
    SequelRails::connection.run 'ALTER TABLE organizations DROP COLUMN IF EXISTS stamen_maps_enabled'
    SequelRails::connection.run 'ALTER TABLE users DROP COLUMN IF EXISTS here_maps_enabled'
    SequelRails::connection.run 'ALTER TABLE users DROP COLUMN IF EXISTS stamen_maps_enabled'
  end
end

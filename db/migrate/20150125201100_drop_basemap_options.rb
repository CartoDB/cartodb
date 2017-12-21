Sequel.migration do
  up do
    SequelRails::connection.run 'ALTER TABLE organizations DROP COLUMN IF EXISTS here_maps_enabled'
    SequelRails::connection.run 'ALTER TABLE organizations DROP COLUMN IF EXISTS stamen_maps_enabled'
    SequelRails::connection.run 'ALTER TABLE organizations DROP COLUMN IF EXISTS rainbow_maps_enabled'
    SequelRails::connection.run 'ALTER TABLE users DROP COLUMN IF EXISTS here_maps_enabled'
    SequelRails::connection.run 'ALTER TABLE users DROP COLUMN IF EXISTS stamen_maps_enabled'
    SequelRails::connection.run 'ALTER TABLE users DROP COLUMN IF EXISTS rainbow_maps_enabled'
  end
  down do
  end
end

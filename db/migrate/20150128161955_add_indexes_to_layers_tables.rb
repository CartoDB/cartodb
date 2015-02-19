Sequel.migration do
  up do

    Rails::Sequel.connection.run(%Q{
      CREATE INDEX layers_maps_map_id_idx ON layers_maps (map_id)
    })

    Rails::Sequel.connection.run(%Q{
      CREATE INDEX layers_kind_idx ON layers (kind)
    })

  end

  down do
    Rails::Sequel.connection.run(%Q{
      DROP INDEX IF EXISTS layers_maps_map_id_idx
    })
    Rails::Sequel.connection.run(%Q{
      DROP INDEX IF EXISTS layers_kind_idx
    })
  end

end

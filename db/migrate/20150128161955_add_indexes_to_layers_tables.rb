Sequel.migration do
  up do

    SequelRails.connection.run(%Q{
      CREATE INDEX layers_maps_map_id_idx ON layers_maps (map_id)
    })

    SequelRails.connection.run(%Q{
      CREATE INDEX layers_kind_idx ON layers (kind)
    })

  end

  down do
    SequelRails.connection.run(%Q{
      DROP INDEX IF EXISTS layers_maps_map_id_idx
    })
    SequelRails.connection.run(%Q{
      DROP INDEX IF EXISTS layers_kind_idx
    })
  end

end

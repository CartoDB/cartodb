Sequel.migration do
  up do
    SequelRails.connection.run(%Q{
      CREATE INDEX external_sources_visualization_id_idx ON external_sources (visualization_id)
    })

    SequelRails.connection.run(%Q{
      CREATE INDEX visualizations_permission_id_idx ON visualizations (permission_id)
    })
  end

  down do
    SequelRails.connection.run(%Q{
      DROP INDEX IF EXISTS external_sources_visualization_id_idx
    })

    SequelRails.connection.run(%Q{
      DROP INDEX IF EXISTS visualizations_permission_id_idx
    })
  end
end

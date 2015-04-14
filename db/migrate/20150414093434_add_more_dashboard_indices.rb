Sequel.migration do
  up do
    Rails::Sequel.connection.run(%Q{
      CREATE INDEX external_sources_visualization_id_idx ON external_sources (visualization_id)
    })

    Rails::Sequel.connection.run(%Q{
      CREATE INDEX visualizations_permission_id_idx ON visualizations (permission_id)
    })
  end

  down do
    Rails::Sequel.connection.run(%Q{
      DROP INDEX IF EXISTS external_sources_visualization_id_idx
    })

    Rails::Sequel.connection.run(%Q{
      DROP INDEX IF EXISTS visualizations_permission_id_idx
    })
  end
end

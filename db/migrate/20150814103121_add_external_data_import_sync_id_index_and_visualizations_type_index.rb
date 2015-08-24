Sequel.migration do
  up do
    Rails::Sequel.connection.run(%Q{
      CREATE INDEX external_data_imports_synchronization_id_idx
      ON external_data_imports
      (synchronization_id)
    })

    Rails::Sequel.connection.run(%Q{
      CREATE INDEX visualizations_type_idx ON visualizations (type)
    })
  end

  down do
    Rails::Sequel.connection.run(%Q{
      DROP INDEX IF EXISTS external_data_imports_synchronization_id_idx
    })

    Rails::Sequel.connection.run(%Q{
      DROP INDEX IF EXISTS visualizations_type_idx
    })
  end
end

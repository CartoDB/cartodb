Sequel.migration do
  up do
    SequelRails.connection.run(%Q{
      CREATE INDEX external_data_imports_synchronization_id_idx
      ON external_data_imports
      (synchronization_id)
    })

    SequelRails.connection.run(%Q{
      CREATE INDEX visualizations_type_idx ON visualizations (type)
    })
  end

  down do
    SequelRails.connection.run(%Q{
      DROP INDEX IF EXISTS external_data_imports_synchronization_id_idx
    })

    SequelRails.connection.run(%Q{
      DROP INDEX IF EXISTS visualizations_type_idx
    })
  end
end

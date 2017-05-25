Sequel.migration do
  up do
    # INFO: Careful, order matters!
    SequelRails.connection.run(%{
      ALTER TABLE data_imports ALTER COLUMN synchronization_id TYPE uuid USING synchronization_id ::uuid;
    })
    SequelRails.connection.run(%{
      ALTER TABLE external_data_imports DROP CONSTRAINT synchronization_id_fkey;
    })
    SequelRails.connection.run(%{
      ALTER TABLE external_data_imports ALTER COLUMN synchronization_id TYPE uuid USING synchronization_id ::uuid;
    })
    SequelRails.connection.run(%{
      ALTER TABLE synchronizations ALTER COLUMN id TYPE uuid USING id ::uuid;
    })
    SequelRails.connection.run(%{
      ALTER TABLE external_data_imports
        ADD CONSTRAINT synchronization_id_fkey FOREIGN KEY (synchronization_id)
          REFERENCES synchronizations (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE;
    })
  end

  down do
  end
end

Sequel.migration do

  up do
    alter_table :external_data_imports do
      add_column :synchronization_id, :text #'uuid'
    end

    SequelRails.connection.run(%Q{
      ALTER TABLE "external_data_imports"
        ADD CONSTRAINT  synchronization_id_fkey
        FOREIGN KEY (synchronization_id)
        REFERENCES synchronizations(id)
        ON DELETE CASCADE
      })
  end

  down do
    alter_table :external_data_imports do
      drop_column :synchronization_id
    end
  end
end

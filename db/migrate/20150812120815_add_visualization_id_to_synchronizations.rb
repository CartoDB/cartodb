Sequel.migration do
  up do
    alter_table :synchronizations do
      add_column :visualization_id, 'uuid'
    end

    SequelRails.connection.run(%Q{
      ALTER TABLE "synchronizations"
        ADD CONSTRAINT  visualization_id_fkey
        FOREIGN KEY (visualization_id)
        REFERENCES visualizations(id)
        ON DELETE CASCADE
    })
  end

  down do
    alter_table :synchronizations do
      drop_column :visualization_id
    end
  end
end

Sequel.migration do
  up do
    alter_table(:geocodings) do
      add_foreign_key :data_import_id, :data_imports, type: 'uuid', null: true
    end

  end

  down do
    alter_table(:geocodings) do
      # INFO: our current version doesn't support this method
      #drop_foreign_key :data_import_id
      drop_constraint :geocodings_data_import_id_fkey
      drop_column :data_import_id
    end
  end
end

Sequel.migration do
  change do
    alter_table :data_imports do
      add_column :tables_created_count, Integer
    end
  end
end

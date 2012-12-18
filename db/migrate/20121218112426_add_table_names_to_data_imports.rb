Sequel.migration do
  change do
    alter_table :data_imports do
      add_column :table_names, :text
    end
  end
end

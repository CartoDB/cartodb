Sequel.migration do
  change do
    alter_table :data_imports do
      add_column :append, :boolean
      add_column :migrate_table, :text
      add_column :table_copy, :text
      add_column :from_query, :text
    end
  end
end

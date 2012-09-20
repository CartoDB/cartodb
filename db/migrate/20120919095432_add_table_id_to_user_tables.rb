Sequel.migration do
  change do
    alter_table :user_tables do
      add_column :table_id, Integer
    end
  end
end

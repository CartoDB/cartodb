Sequel.migration do
  change do
    alter_table :widgets do
      add_index :layer_id
    end
  end
end

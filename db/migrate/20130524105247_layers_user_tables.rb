Sequel.migration do
  up do
    create_table :layers_user_tables do
      primary_key :id
      foreign_key :layer_id, :layers
      foreign_key :user_table_id, :user_tables
    end
  end
  
  down do
    drop_table :layers_user_tables
  end
end

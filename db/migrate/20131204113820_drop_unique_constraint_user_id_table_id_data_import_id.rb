Sequel.migration do
  up do
    #alter_table :data_imports do
    #  drop_index [:user_id, :table_id], :unique => true
    #end
  end
  
  down do
    #alter_table :data_imports do
    #  add_index [:user_id, :table_id], :unique => true
    #end
  end
end


Sequel.migration do
  up do
    add_column :users, :api_key, :text
  end
  
  down do
    drop_column :users, :api_key
  end
end

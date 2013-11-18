Sequel.migration do
  up do
    drop_table :api_keys
  end
  
  down do
    create_table :api_keys do
      primary_key :id
      String :api_key, null: false, unique: true, index: true
      Integer :user_id, null: false
      String :domain, null: false
    end
  end
end

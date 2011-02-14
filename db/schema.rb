Sequel.migration do
  up do
    create_table(:api_keys, :ignore_index_errors=>true) do
      primary_key :id
      String :api_key, :text=>true, :null=>false
      Integer :user_id, :null=>false
      String :domain, :text=>true, :null=>false
      
      index [:api_key]
      index [:api_key], :name=>:api_keys_api_key_key, :unique=>true
    end
    
    create_table(:schema_migrations) do
      String :filename, :text=>true, :null=>false
      
      primary_key [:filename]
    end
    
    create_table(:tags, :ignore_index_errors=>true) do
      primary_key :id
      String :name, :text=>true, :null=>false
      Integer :user_id, :null=>false
      Integer :table_id, :null=>false
      
      index [:table_id]
      index [:user_id]
      index [:user_id, :table_id, :name], :unique=>true
    end
    
    create_table(:user_tables, :ignore_index_errors=>true) do
      primary_key :id
      Integer :user_id, :null=>false
      String :name, :text=>true, :null=>false
      Integer :privacy, :default=>0, :null=>false
      DateTime :updated_at, :null=>false
      String :tags, :text=>true
      Integer :rows_counted, :default=>0
      Integer :rows_estimated, :default=>0
      
      index [:name, :user_id], :unique=>true
      index [:user_id]
      index [:user_id, :privacy]
    end
    
    create_table(:users, :ignore_index_errors=>true) do
      primary_key :id
      String :email, :text=>true, :null=>false
      String :crypted_password, :text=>true, :null=>false
      String :salt, :text=>true, :null=>false
      String :database_name, :text=>true
      String :username, :text=>true, :null=>false
      Integer :tables_count, :default=>0, :null=>false
      String :keys, :text=>true
      
      index [:email], :name=>:users_email_key, :unique=>true
      index [:username], :name=>:users_username_key, :unique=>true
    end
  end
  
  down do
    drop_table(:api_keys, :schema_migrations, :tags, :user_tables, :users)
  end
end

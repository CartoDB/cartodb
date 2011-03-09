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
    
    create_table(:client_applications, :ignore_index_errors=>true) do
      primary_key :id
      String :name, :text=>true
      String :url, :text=>true
      String :support_url, :text=>true
      String :callback_url, :text=>true
      String :key, :text=>true
      String :secret, :text=>true
      Integer :user_id
      DateTime :created_at, :null=>false
      DateTime :updated_at, :null=>false
      
      index [:key], :name=>:client_applications_key_key, :unique=>true
    end
    
    create_table(:oauth_nonces, :ignore_index_errors=>true) do
      primary_key :id
      String :nonce, :text=>true
      Integer :timestamp
      DateTime :created_at, :null=>false
      DateTime :updated_at, :null=>false
      
      index [:nonce, :timestamp], :unique=>true
    end
    
    create_table(:oauth_tokens, :ignore_index_errors=>true) do
      primary_key :id
      Integer :user_id
      String :type, :text=>true
      Integer :client_application_id
      String :token, :text=>true
      String :secret, :text=>true
      String :callback_url, :text=>true
      String :verifier, :text=>true
      String :scope, :text=>true
      DateTime :authorized_at
      DateTime :invalidated_at
      DateTime :valid_to
      DateTime :created_at, :null=>false
      DateTime :updated_at, :null=>false
      
      index [:token], :name=>:oauth_tokens_token_key, :unique=>true
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
      String :geometry_columns, :text=>true
      Integer :rows_counted, :default=>0
      Integer :rows_estimated, :default=>0
      String :indexes
      
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
      TrueClass :admin
      TrueClass :enabled, :default=>false
      
      index [:email], :name=>:users_email_key, :unique=>true
      index [:username], :name=>:users_username_key, :unique=>true
    end
  end
  
  down do
    drop_table(:api_keys, :client_applications, :oauth_nonces, :oauth_tokens, :schema_migrations, :tags, :user_tables, :users)
  end
end

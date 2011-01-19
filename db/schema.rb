Sequel.migration do
  up do
    create_table(:schema_migrations) do
      String :filename, :text=>true, :null=>false
      
      primary_key [:filename]
    end
    
    create_table(:user_tables, :ignore_index_errors=>true) do
      primary_key :id
      Integer :user_id, :null=>false
      String :name, :text=>true, :null=>false
      Integer :privacy, :default=>0, :null=>false
      String :db_table_name, :text=>true, :null=>false
      
      index [:user_id]
      index [:user_id, :privacy]
    end
    
    create_table(:users, :ignore_index_errors=>true) do
      primary_key :id
      String :email, :text=>true, :null=>false
      String :crypted_password, :text=>true, :null=>false
      String :salt, :text=>true, :null=>false
      
      index [:email], :name=>:users_email_key, :unique=>true
    end
  end
  
  down do
    drop_table(:schema_migrations, :user_tables, :users)
  end
end

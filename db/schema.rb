Sequel.migration do
  up do
    create_table(:schema_migrations) do
      String :filename, :text=>true, :null=>false
      
      primary_key [:filename]
    end
    
    create_table(:users, :ignore_index_errors=>true) do
      primary_key :id
      String :email, :text=>true, :null=>false
      String :crypted_password, :text=>true, :null=>false
      
      index [:email], :name=>:users_email_key, :unique=>true
    end
  end
  
  down do
    drop_table(:schema_migrations, :users)
  end
end

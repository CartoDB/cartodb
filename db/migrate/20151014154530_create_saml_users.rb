Sequel.migration do 
  change do
    create_table :saml_users do
      String :saml_name_id, primary_key:true
      String :cartodb_username, null:false
    end
  end
end

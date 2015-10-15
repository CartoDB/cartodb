Sequel.migration do 
  change do

    create_table :saml_identity_providers do
      String :idp_name, primary_key:true
      Text :idp_cert, null:false
    end

  end
end

Sequel.migration do 
  change do

    create_table :saml_identity_providers do
      String :idp_name, primary_key:true
      Text   :idp_cert, null:false
      String :idp_sso_target_url, null:true
      String :idp_slo_target_url, null:true
      String :idp_cert_fingerprint, null:true
      String :idp_cert_fingerprint_algorithm, null:true
    end

    create_table :saml_users do
      String :saml_name_id, primary_key:true
      foreign_key:idp_name, :saml_identity_providers, :type=>'text'
      String :cartodb_username, null:false
    end

    alter_table :organizations do
      add_foreign_key :saml_idp_name, :saml_identity_providers, :type=>'text'
    end

  end
end

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

  end
end

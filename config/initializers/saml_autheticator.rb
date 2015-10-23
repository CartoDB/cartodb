class SamlAuthenticator
  def self.get_user_info(params)

     response = OneLogin::RubySaml::Response.new(params[:SAMLResponse])

     saml_settings = get_saml_settings(params[:saml_idp])

     if (!saml_settings)
        return nil
     end

     response.settings = get_saml_settings(params[:saml_idp])

     if response.is_valid?
       user_data = SamlUser.where(saml_name_id: response.nameid).first
       return user_data
     else
       cartoDB.notify_error "Response Invalid. Errors: #{response.errors}"
     end

     return nil
  end

  def self.get_saml_settings(idp_name)
    settings = OneLogin::RubySaml::Settings.new

    settings.soft = true

    saml_idp = SamlIdentityProvider.where(idp_name: idp_name).first

    if (saml_idp == nil)
       cartoDB.notify_error "Could not find the idp record in DB for #{idp_name}"
       return nil
    end

    settings.idp_cert = saml_idp.idp_cert

    settings
  end


  def self.check_user(user_data)
    existing_user = ::User.where(username: user_data.cartodb_username).first

    if (existing_user != nil)
        return existing_user
    end
  end

end

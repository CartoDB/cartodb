require 'yaml'

Warden::Strategies.add(:saml_header) do

  def valid?
    true
  end

  def store?
    true
  end

  def authenticate!
    user_info = SamlAuthenticator.get_user_info(params)

    user = SamlAuthenticator.check_user(user_info)
    
    user ? success!(user) : fail!
  end
end 
 
class SamlAuthenticator
  def self.get_user_info(params)
   
     response = OneLogin::RubySaml::Response.new(params[:SAMLResponse])
   
     response.settings = get_saml_settings(params[:saml_idp])
   
     if response.is_valid?
       puts "The response is valid"
   
       user_data = SamlUser.where(saml_name_id: response.nameid).first
       return user_data
   
     else
   
       puts "Response Invalid. Errors: #{response.errors}"

     end

     return nil
  end

  def self.get_saml_settings(idp_name)
    settings = OneLogin::RubySaml::Settings.new

    settings.soft = true
    
    saml_idp = SamlIdentityProvider.where(idp_name: idp_name).first
    
    settings.idp_cert = saml_idp.idp_cert
    
    settings
  end


  def self.check_user(user_data)
    existing_user = User.where("username = '#{user_data.cartodb_username}'").first

    if (existing_user != nil) 
        return existing_user
    end
  end


end 



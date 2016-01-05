require 'yaml'

class SamlController < ApplicationController
 layout 'frontend'

 # acs method
 def initialize
   @signup_source = 'SAML Sign-On'
   @signup_errors = {}
 end

 def acs
    logger.info "inside saml acs"
    
    begin 
      load_organization(params[:saml_idp])

      user_info = SamlAuthenticator.get_user_info(params)
      raise "No user information available." unless user_info != nil

      scope = user_info.cartodb_username

      user = authenticate!(:saml_header, {}, :scope => scope) unless authenticated?(scope)
      raise "Athentication failed with SAML" unless user != nil
    
      redirect_to CartoDB.url(self, 'dashboard', {trailing_slash: true}, user)
      
    rescue Exception => e
        logger.error e.message
        @signup_source = 'Saml'
        @signup_errors[:saml_error] = [e.message]
      
        render 'shared/signup_issue'
    end
 end

 def load_organization(saml_idp)

    @organization = Carto::Organization.where(saml_idp_name: saml_idp).first 

    # At this point, we are support SAML authentication only for the users 
    # belonging to an organization
    
    if (@organization == nil)
      raise "SAML authentication needs to have an associated organization"
    end

    @org_admin = Carto::User.where(id:@organization.owner_id).first 
    
    if (@org_admin == nil)
      raise "SAML authentication needs to have an organization admin user"
    end

 end

end #end of the controller class

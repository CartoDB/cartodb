require 'yaml'

class SamlController < ApplicationController
 layout 'frontend'

 # acs method
 def initialize
   @signup_source = 'SAML Sign-On'
   @signup_errors = {}
 end

 def acs
    logger.info "inside smal acs"
    
    load_organization(params[:saml_idp])
    
    user_info = SamlAuthenticator.get_user_info(params)

    if user_info == nil
       render 'shared/signup_issue'
       return
    end

    scope = user_info.cartodb_username

    user = authenticate!(:saml_header, {}, :scope => scope) unless authenticated?(scope)
 
    if user == nil

      @signup_errors[:saml_error] = ["single-sign-on athentication failed."]

      logger.error @signup_errors[:saml_error].first

      render 'shared/signup_issue'
      return

    end
    
    redirect_to CartoDB.url(self, 'dashboard', {trailing_slash: true}, user)
 end

 def load_organization(saml_idp)

    @organization = Carto::Organization.where(saml_idp_name: saml_idp).first 

    @org_admin = Carto::User.where(id:@organization.owner_id).first unless @organization.nil? 

 end

end #end of the controller class

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
    
    user_info = SamlAuthenticator.get_user_info(params)
    if user_info == nil
       load_organization(params[:saml_idp])
       render 'shared/signup_issue'
       return
    end

    scope = user_info.cartodb_username

    logger.info "uuid after calling Saml " + scope

    user = authenticate!(:saml_header, {}, :scope => scope) unless authenticated?(scope)
 
    if user == nil

      @organization = BBOrganization.new

      @signup_errors[:saml_error] = ["Single sing on athentication failed."]

      logger.error @signup_errors[:saml_error].first

      render 'shared/signup_issue'

    end
    
    redirect_to CartoDB.url(self, 'dashboard', {trailing_slash: true}, user)
 end

 def load_organization(saml_idp)

    @organization = Carto::Organization.where(saml_idp_name: saml_idp).first 

    logger.info "--- The organization is #{@organization.name}"

    @org_admin = Carto::User.where(id:@organization.owner_id).first

    logger.info "--- The organization owner is #{@org_admin.username}"
 end


end #end of the controller class


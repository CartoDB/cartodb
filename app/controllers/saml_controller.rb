require 'yaml'

class SamlController < ApplicationController
 layout 'frontend'

 before_filter :load_organization
 # acs method
  def acs
   
    logger.info "inside smal acs"
    
    user_info = SamlAuthenticator.get_user_info(params)
    scope = user_info.username

    logger.info "uuid after calling Saml " + scope

    user = authenticate!(:saml_header, {}, :scope => scope) unless authenticated?(scope)
    
    redirect_to CartoDB.url(self, 'dashboard', {trailing_slash: true}, user)

  end

  def load_organization
    subdomain = CartoDB.subdomain_from_request(request)
    @organization = Carto::Organization.where(name: subdomain).first if subdomain
  end


end #end of the controller class

class UserInfo < ActiveRecord::Base
  self.table_name = "bb_user_info"
  self.primary_key = "uuid"
end



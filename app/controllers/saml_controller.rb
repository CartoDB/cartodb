require 'yaml'

class SamlController < ApplicationController
 layout 'frontend'

 before_filter :load_organization
 # acs method
 def initialize
   @signup_source = 'SAML Sign-On'
   @signup_errors = {}
 end

 def acs
    logger.info "inside smal acs"

    user_info = SamlAuthenticator.get_user_info(params)
    if user_info == nil
       @organization = BBOrganization.new
       @signup_errors[:saml_error] = ["You are not authorized to run the functionality"]
       logger.error @signup_errors[:saml_error].first
       render 'shared/signup_issue'
       return
    end

    scope = user_info.username

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

 def load_organization
    subdomain = CartoDB.subdomain_from_request(request)
    @organization = Carto::Organization.where(name: subdomain).first if subdomain
 end


end #end of the controller class

class UserInfo < Sequel::Model
end

class BBOrganization
  class BBOwner
    def email
     "bshaklton@bloomberg.net"
    end
  end

  def initialize
  @owner = BBOwner.new
  end

  def name
     "PWHO BMAP"
  end
  def color
     "#FF5522"
  end
  def owner
     @owner
  end
end



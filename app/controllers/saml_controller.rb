class SamlController < ApplicationController
 layout 'frontend'

 before_filter :load_organization
 # acs method
  def acs

    logger.info "inside acs"
    scope = SamlAuthenticator.username_from_saml(params)
    user = authenticate!(:saml_header, {}, :scope => scope) unless authenticated?(scope)
    redirect_to CartoDB.url(self, 'dashboard', {trailing_slash: true}, user)
  end

  def load_organization
    subdomain = CartoDB.subdomain_from_request(request)
    @organization = Carto::Organization.where(name: subdomain).first if subdomain
  end

end #end of the controller class

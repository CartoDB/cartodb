require 'json'
require 'yaml'

class SamlController < ApplicationController
 layout 'frontend'

 before_filter :load_organization
 # acs method
  def acs
    logger.info "inside acs"
    scope = SamlAuthenticator.username_from_saml(params)
    #user = authenticate!(:saml_header, {}, :scope => scope) unless authenticated?(scope)
    user = check_user
    redirect_to CartoDB.url(self, 'dashboard', {trailing_slash: true}, user)
  end

  def load_organization
    subdomain = CartoDB.subdomain_from_request(request)
    @organization = Carto::Organization.where(name: subdomain).first if subdomain
  end

  def get_user
    jsonStr = '{"username":"xyz5","email":"xyz5@xyz.com","password":"123456","password_confirmation":"123456"}'

    user = JSON.parse(jsonStr)
    user
  end

  def set_user_attributes(user, data)
    logger.info  data['username']
    user.username = data['username']
    user.email = data['email']
    user.password = data['password']
    user.password_confirmation = data['password']
  end

  def check_user
    user_data = get_user
    existing_user = User.where("email = '#{user_data['email']}' OR username = '#{user_data['username']}'").first

    logger.info "working 1"
    if (existing_user != nil) 
        logger.info "working 1i1"
        return existing_user
    end

    logger.info "working 2"
    user = User.new
    set_user_attributes(user, user_data)
    #logger.info user.to_yaml
    user.save(raise_on_failure: true)
    user.create_in_central

    user

  end

  def saml_user_not_at_cartodb

    p_user = get_user
    
    cartodb_username = p_user.username
    organization_id = ""
    ldap_username = p_user.username
    ldap_email = p_user.email

    @organization = ::Organization.where(id: organization_id).first

    account_creator = CartoDB::UserAccountCreator.new

    account_creator.with_organization(@organization)
                   .with_username(cartodb_username)
    account_creator.with_email(ldap_email) unless ldap_email.nil?

    if account_creator.valid?
      creation_data = account_creator.enqueue_creation(self)

      flash.now[:success] = 'User creation in progress'
      @user_creation_id = creation_data[:id]
      @user_name = creation_data[:id]
      @redirect_url = CartoDB.url(self, 'login')
      render 'shared/signup_confirmation'
    else
      errors = account_creator.validation_errors
      CartoDB.notify_debug('User not valid at signup', { errors: errors } )
      @signup_source = 'LDAP'
      @signup_errors = errors
      render 'shared/signup_issue'
    end
  rescue => e
    CartoDB.notify_exception(e, { new_user: account_creator.user.inspect })
    flash.now[:error] = e.message
    render action: 'new'
  end


end #end of the controller class

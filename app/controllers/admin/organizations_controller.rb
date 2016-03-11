# coding: utf-8
require_relative './../helpers/avatar_helper'

class Admin::OrganizationsController < Admin::AdminController
  include AvatarHelper

  ssl_required :show, :settings, :settings_update, :regenerate_all_api_keys, :groups, :auth, :auth_update
  before_filter :login_required, :load_organization_and_members, :load_ldap_configuration
  helper_method :show_billing

  layout 'application'

  def show
    respond_to do |format|
      format.html { render 'show' }
    end
  end

  def settings
    @avatar_valid_extensions = AVATAR_VALID_EXTENSIONS
    
    respond_to do |format|
      format.html { render 'settings' }
    end
  end

  def groups
    respond_to do |format|
      format.html { render 'groups' }
    end
  end

  def settings_update
    attributes = params[:organization]

    if attributes.include?(:avatar_url) && valid_avatar_file?(attributes[:avatar_url])
      @organization.avatar_url = attributes[:avatar_url]
    end

    @organization.website = attributes[:website]
    @organization.admin_email = attributes[:admin_email]
    @organization.description = attributes[:description]
    @organization.display_name = attributes[:display_name]
    @organization.color = attributes[:color]

    if attributes.include?(:default_quota_in_bytes)
      default_quota_in_bytes = attributes[:default_quota_in_bytes]
      @organization.default_quota_in_bytes = default_quota_in_bytes.blank? ? nil : default_quota_in_bytes.to_i * 1024 * 1024
    end
    @organization.discus_shortname = attributes[:discus_shortname]
    @organization.twitter_username = attributes[:twitter_username]
    @organization.location = attributes[:location]

    @organization.update_in_central
    @organization.save(raise_on_failure: true)

    redirect_to CartoDB.url(self, 'organization_settings', {}, current_user), flash: { success: "Your changes have been saved correctly." }
  rescue CartoDB::CentralCommunicationFailure => e
    @organization.reload
    flash.now[:error] = "There was a problem while updating your organization. Please, try again and contact us if the problem persists. #{e.user_message}"
    render action: 'settings'
  rescue Sequel::ValidationFailed => e
    flash.now[:error] = "There's been a validation error, check your values"
    render action: 'settings'
  end

  def regenerate_all_api_keys
    @organization.users.each { |user|
      user.regenerate_api_key
    }

    redirect_to CartoDB.url(self, 'organization_settings', {}, current_user), flash: { success: "Users API keys regenerated successfully" }
  rescue => e
    CartoDB.notify_exception(e, { organization: @organization.id, current_user: current_user.id })
    flash[:error] = "There was an error regenerating the API keys. Please, try again and contact us if the problem persists"
    render action: 'settings'
  end

  def auth
    respond_to do |format|
      format.html { render 'auth' }
    end
  end

  def auth_update
    attributes = params[:organization]
    @organization.whitelisted_email_domains = attributes[:whitelisted_email_domains].split(",")
    @organization.auth_username_password_enabled = attributes[:auth_username_password_enabled]
    @organization.auth_google_enabled = attributes[:auth_google_enabled]
    @organization.update_in_central
    @organization.save(raise_on_failure: true)

    redirect_to CartoDB.url(self, 'organization_auth', {}, current_user), flash: { success: "Your changes have been saved correctly." }
  rescue CartoDB::CentralCommunicationFailure => e
    @organization.reload
    flash.now[:error] = "There was a problem while updating your organization. Please, try again and contact us if the problem persists. #{e.user_message}"
    render action: 'settings'
  rescue Sequel::ValidationFailed => e
    flash.now[:error] = "There's been a validation error, check your values"
    render action: 'settings'
  end

  private

  def load_organization_and_members
    @organization = current_user.organization
    raise RecordNotFound unless @organization.present? && current_user.organization_owner?

    # INFO: Special scenario of handcrafted URL to go to organization-based signup page
    @organization_signup_url =
      "#{CartoDB.protocol}://#{@organization.name}.#{CartoDB.account_host}#{CartoDB.path(self, 'signup_organization_user')}"
  end

  def show_billing
    !Cartodb.config[:cartodb_com_hosted].present? && (!current_user.organization.present? || current_user.organization_owner?)
  end

  def load_ldap_configuration
    @ldap_configuration = Carto::Ldap::Configuration.where(organization_id: @organization.id).first
  end

end

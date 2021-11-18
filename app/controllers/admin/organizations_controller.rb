require_relative './../helpers/avatar_helper'
require_relative './../helpers/organization_notifications_helper'

class Admin::OrganizationsController < Admin::AdminController
  include AvatarHelper
  include OrganizationNotificationsHelper

  ssl_required :show, :settings, :settings_update, :regenerate_all_api_keys, :groups, :auth, :auth_update,
               :notifications, :new_notification, :destroy_notification, :destroy
  before_filter :login_required, :load_organization_and_members, :load_ldap_configuration
  before_filter :owners_only, only: [:settings, :settings_update, :regenerate_all_api_keys, :auth, :auth_update,
                                     :destroy]
  before_filter :enforce_engine_enabled, only: :regenerate_all_api_keys
  before_filter :load_carto_organization, only: [:notifications, :new_notification]
  before_filter :load_notification, only: [:destroy_notification]
  before_filter :load_organization_notifications, only: [:settings, :auth, :show, :groups, :notifications,
                                                         :new_notification]
  helper_method :show_billing

  layout 'application'

  def show
    respond_to do |format|
      format.html { render 'show' }
    end
  end

  def destroy
    deletion_password_confirmation = params[:deletion_password_confirmation]
    if current_user.needs_password_confirmation? && !current_user.validate_old_password(deletion_password_confirmation)
      flash.now[:error] = "Password doesn't match"
      render 'show', status: 400
    else
      @organization.destroy_cascade(delete_in_central: true)
      redirect_to logout_url
    end
  rescue StandardError => e
    log_error(message: 'Error deleting organization', exception: e, organization: @organization)
    flash.now[:error] = "Error deleting organization: #{e.message}"
    render 'show', status: 500
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

  def notifications(status = 200)
    @notification ||= Carto::Notification.new(recipients: Carto::Notification::RECIPIENT_ALL)
    @notifications = @carto_organization.notifications.limit(12).map { |n| Carto::Api::NotificationPresenter.new(n) }
    respond_to do |format|
      format.html { render 'notifications', status: status }
    end
  end

  def new_notification
    valid_password_confirmation
    carto_organization = Carto::Organization.find(@organization.id)
    attributes = {
      body: params[:carto_notification]['body'],
      icon: Carto::Notification::ICON_ALERT,
      recipients: params[:carto_notification]['recipients']
    }
    @notification = carto_organization.notifications.build(attributes)
    if @notification.save
      redirect_to CartoDB.url(self, 'organization_notifications_admin', user: current_user),
                  flash: { success: 'Notification sent!' }
    else
      flash.now[:error] = @notification.errors.full_messages.join(', ')
      notifications
    end
  rescue Carto::PasswordConfirmationError => e
    flash.now[:error] = e.message
    notifications(e.status)
  end

  def destroy_notification
    @notification.destroy

    redirect_to CartoDB.url(self, 'organization_notifications_admin', user: current_user),
                flash: { success: 'Notification was successfully deleted!' }
  end

  def settings_update
    valid_password_confirmation
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

    redirect_to CartoDB.url(self, 'organization_settings', user: current_user),
                flash: { success: "Your changes have been saved correctly." }
  rescue CartoDB::CentralCommunicationFailure => e
    @organization.reload
    flash.now[:error] = "There was a problem while updating your organization. Please, try again and contact us if the problem persists. #{e.user_message}"
    render action: 'settings'
  rescue Carto::PasswordConfirmationError => e
    flash.now[:error] = e.message
    render action: 'settings', status: e.status
  rescue Sequel::ValidationFailed => e
    flash.now[:error] = "There's been a validation error, check your values"
    render action: 'settings'
  end

  def regenerate_all_api_keys
    valid_password_confirmation
    @organization.users.map(&:sequel_user).each(&:regenerate_all_api_keys)

    redirect_to CartoDB.url(self, 'organization_settings', user: current_user),
                flash: { success: "Users API keys regenerated successfully" }
  rescue Carto::PasswordConfirmationError => e
    flash.now[:error] = e.message
    render action: 'settings', status: e.status
  rescue StandardError => e
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
    valid_password_confirmation
    attributes = params[:organization]
    @organization.whitelisted_email_domains = attributes[:whitelisted_email_domains].split(",")
    @organization.auth_username_password_enabled = attributes[:auth_username_password_enabled]
    @organization.auth_google_enabled = attributes[:auth_google_enabled]
    @organization.auth_github_enabled = attributes[:auth_github_enabled]
    @organization.strong_passwords_enabled = attributes[:strong_passwords_enabled]
    @organization.password_expiration_in_d = attributes[:password_expiration_in_d]
    @organization.random_saml_username = attributes[:random_saml_username]
    @organization.update_in_central
    @organization.save(raise_on_failure: true)

    redirect_to CartoDB.url(self, 'organization_auth', user: current_user),
                flash: { success: "Your changes have been saved correctly." }
  rescue CartoDB::CentralCommunicationFailure => e
    @organization.reload
    flash.now[:error] = "There was a problem while updating your organization. Please, try again and contact us if the problem persists. #{e.user_message}"
    render action: 'auth'
  rescue Carto::PasswordConfirmationError => e
    flash.now[:error] = e.message
    render action: 'auth', status: e.status
  rescue Sequel::ValidationFailed => e
    flash.now[:error] = "There's been a validation error, check your values"
    render action: 'auth'
  end

  private

  def load_organization_and_members
    raise RecordNotFound unless current_user.organization_admin?
    @organization = current_user.organization

    display_signup_warnings if @organization.signup_page_enabled

    # INFO: Special scenario of handcrafted URL to go to organization-based signup page
    @organization_signup_url =
      "#{CartoDB.protocol}://#{@organization.name}.#{CartoDB.account_host}#{CartoDB.path(self, 'signup_organization_user')}"
  end

  def owners_only
    raise RecordNotFound unless current_user.organization_owner?
  end

  def display_signup_warnings
    warning = []
    warning << "Your organization has run out of quota" unless @organization.valid_disk_quota?
    warning << "Your organization has run out of seats" unless @organization.valid_builder_seats?
    unless warning.empty?
      flash.now[:warning] = "#{warning.join('. ')}."
      flash.now[:warning_detail] = "Users won't be able to sign up to your organization. <a href='mailto:contact@carto.com'>Contact us</a> to increase your quota."
    end
  end

  def show_billing
    !Cartodb.config[:cartodb_com_hosted].present? && (!current_user.organization.present? || current_user.organization_owner?)
  end

  def load_ldap_configuration
    @ldap_configuration = Carto::Ldap::Configuration.where(organization_id: @organization.id).first
  end

  def enforce_engine_enabled
    unless @organization.engine_enabled
      render_403
    end
  end

  def load_carto_organization
    @carto_organization = Carto::Organization.find(@organization.id)
  end

  def load_notification
    @notification = Carto::Notification.find(params[:id])
  end
end

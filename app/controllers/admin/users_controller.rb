# coding: utf-8
require_dependency 'google_plus_api'
require_dependency 'google_plus_config'
require_relative '../../../services/datasources/lib/datasources'
require_relative '../helpers/avatar_helper'
require_relative '../helpers/organization_notifications_helper'

class Admin::UsersController < Admin::AdminController
  include LoginHelper
  include AvatarHelper
  include OrganizationNotificationsHelper

  ssl_required  :account, :profile, :account_update, :profile_update, :delete, :lockout

  before_filter :invalidate_browser_cache
  before_filter :login_required
  before_filter :setup_user
  before_filter :initialize_google_plus_config, only: [:profile, :account]
  before_filter :load_services, only: [:account, :account_update, :delete]
  before_filter :load_account_deletion_info, only: [:account, :delete]
  before_filter :load_dashboard_notifications, only: [:account, :profile]
  before_filter :load_organization_notifications, only: [:account, :profile]

  skip_before_filter :check_user_state, only: [:delete]

  layout 'application'

  PASSWORD_DOES_NOT_MATCH_MESSAGE = 'Password does not match'.freeze

  def profile
    if current_user.has_feature_flag?('dashboard_migration')
      return render(file: "public/static/profile/index.html", layout: false)
    end

    @avatar_valid_extensions = AVATAR_VALID_EXTENSIONS

    respond_to do |format|
      format.html { render 'profile' }
    end
  end

  def account
    if current_user.has_feature_flag?('dashboard_migration')
      return render(file: "public/static/account/index.html", layout: false)
    end

    respond_to do |format|
      format.html { render 'account' }
    end
  end

  def account_update
    attributes = params[:user]

    password_change = (attributes[:new_password].present? || attributes[:confirm_password].present?) &&
      @user.can_change_password?

    if password_change
      @user.change_password(
        attributes[:old_password].presence,
        attributes[:new_password].presence,
        attributes[:confirm_password].presence
      )
    end

    if @user.can_change_email? && attributes[:email].present?
      @user.set_fields(attributes, [:email])
    end

    raise Sequel::ValidationFailed.new('Validation failed') unless @user.errors.try(:empty?) && @user.valid?
    @user.update_in_central
    @user.save(raise_on_failure: true)

    update_session_security_token(@user) if password_change

    redirect_to CartoDB.url(self, 'account_user', {}, current_user), flash: { success: "Your changes have been saved correctly." }
  rescue CartoDB::CentralCommunicationFailure => e
    CartoDB::Logger.error(exception: e, user: @user, params: params)
    flash.now[:error] = "There was a problem while updating your data. Please, try again and contact us if the problem persists"
    render action: :account
  rescue Sequel::ValidationFailed => e
    flash.now[:error] = "Error updating your account details"
    render action: :account
  end

  def profile_update
    attributes = params[:user]

    if attributes[:avatar_url].present? && valid_avatar_file?(attributes[:avatar_url])
      @user.avatar_url = attributes.fetch(:avatar_url, nil)
    end

    @user.valid_password_confirmation(attributes.fetch(:password_confirmation, ''))

    # This fields are optional
    @user.name = attributes.fetch(:name, nil)
    @user.last_name = attributes.fetch(:last_name, nil)
    @user.website = attributes.fetch(:website, nil)
    @user.description = attributes.fetch(:description, nil)
    @user.location = attributes.fetch(:location, nil)
    @user.twitter_username = attributes.fetch(:twitter_username, nil)
    @user.disqus_shortname = attributes.fetch(:disqus_shortname, nil)

    @user.set_fields(attributes, [:available_for_hire]) if attributes[:available_for_hire].present?

    raise Sequel::ValidationFailed.new(@user.errors.full_messages.join(', ')) unless @user.errors.empty?
    @user.update_in_central
    @user.save(raise_on_failure: true)

    redirect_to CartoDB.url(self, 'profile_user', {}, current_user), flash: { success: "Your changes have been saved correctly." }
  rescue CartoDB::CentralCommunicationFailure => e
    CartoDB::Logger.error(exception: e, user: @user, params: params)
    flash.now[:error] = "There was a problem while updating your data. Please, try again and contact us if the problem persists"
    render action: :profile
  rescue Sequel::ValidationFailed => e
    flash.now[:error] = "Error updating your profile details"
    render action: :profile
  end

  def delete
    deletion_password_confirmation = params[:deletion_password_confirmation]
    if @user.needs_password_confirmation? && !@user.validate_old_password(deletion_password_confirmation)
      raise PASSWORD_DOES_NOT_MATCH_MESSAGE
    end

    @user.destroy_account

    redirect_to logout_url
  rescue CartoDB::CentralCommunicationFailure => e
    CartoDB::Logger.error(exception: e, message: 'Central error deleting user at CartoDB', user: @user)
    flash.now[:error] = "Error deleting user: #{e.user_message}"
    render 'account'
  rescue => e
    CartoDB.notify_exception(e, { user: @user.inspect }) unless e.message == PASSWORD_DOES_NOT_MATCH_MESSAGE
    flash.now[:error] = "Error deleting user: #{e.message}"
    render 'account'
  end

  def lockout
    if current_user.locked?
      @expiration_days = @user.remaining_days_deletion
      @payments_url = @user.plan_url(request.protocol)
      render locals: { breadcrumb: false }
    else
      render_404
    end
  end

  private

  def initialize_google_plus_config
    signup_action = Cartodb::Central.sync_data_with_cartodb_central? ? Cartodb::Central.new.google_signup_url : '/google/signup'
    @google_plus_config = ::GooglePlusConfig.instance(CartoDB, Cartodb.config, signup_action)
  end

  def load_services
    @services = @user.get_oauth_services
  end

  def load_account_deletion_info
    @cant_be_deleted_reason = @user.cant_be_deleted_reason
    @can_be_deleted = @cant_be_deleted_reason.nil?
  end

  def setup_user
    @user = current_user
  end

  def load_dashboard_notifications
    carto_user = Carto::User.where(id: current_user.id).first if current_user

    @dashboard_notifications = carto_user ? carto_user.notifications_for_category(:dashboard) : {}
  end

end

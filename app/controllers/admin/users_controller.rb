# coding: utf-8
require_dependency 'google_plus_api'
require_dependency 'google_plus_config'
require_relative '../../../services/datasources/lib/datasources'

class Admin::UsersController < ApplicationController
  ssl_required  :account, :profile, :account_update, :profile_update, :delete

  before_filter :login_required
  before_filter :setup_user
  before_filter :initialize_google_plus_config, only: [:profile, :account]

  layout 'application'

  def profile
    respond_to do |format|
      format.html { render 'profile' }
    end
  end

  def account
    @services = get_oauth_services

    respond_to do |format|
      format.html { render 'account' }
    end
  end

  def account_update
    @services = get_oauth_services
    
    attributes = params[:user]
    if attributes[:new_password].present? || attributes[:confirm_password].present?
      @user.change_password(
        attributes[:old_password].presence,
        attributes[:new_password].presence,
        attributes[:confirm_password].presence
      )
    end

    if @user.can_change_email && attributes[:email].present?
      @user.set_fields(attributes, [:email])
    end
    
    @user.save(raise_on_failure: true)
    @user.update_in_central

    redirect_to CartoDB.url(self, 'account_user', {}, current_user), flash: { success: "Your changes have been saved correctly." }
  rescue CartoDB::CentralCommunicationFailure => e
    Rollbar.report_exception(e, params, @user)
    flash.now[:error] = "There was a problem while updating your data. Please, try again and contact us if the problem persists"
    render action: :account
  rescue Sequel::ValidationFailed => e
    flash.now[:error] = "Error updating your account details"
    render action: :account
  end

  def profile_update
    attributes = params[:user]

    if attributes[:avatar_url].present?
      @user.avatar_url = attributes.fetch(:avatar_url, nil)
    end

    # This fields are optional
    @user.name = attributes.fetch(:name, nil)
    @user.website = attributes.fetch(:website, nil)
    @user.description = attributes.fetch(:description, nil)
    @user.twitter_username = attributes.fetch(:twitter_username, nil)
    @user.disqus_shortname = attributes.fetch(:disqus_shortname, nil)

    @user.set_fields(attributes, [:available_for_hire]) if attributes[:available_for_hire].present?

    @user.update_in_central
    @user.save(raise_on_failure: true)

    redirect_to CartoDB.url(self, 'profile_user', {}, current_user), flash: { success: "Your changes have been saved correctly." }
  rescue CartoDB::CentralCommunicationFailure => e
    Rollbar.report_exception(e, params, @user)
    flash.now[:error] = "There was a problem while updating your data. Please, try again and contact us if the problem persists"
    render action: :profile
  rescue Sequel::ValidationFailed => e
    flash.now[:error] = "Error updating your profile details"
    render action: :profile
  end

  def delete
    deletion_password_confirmation = params[:deletion_password_confirmation]
    if !@user.validate_old_password(deletion_password_confirmation)
      raise 'Password does not match'
    end

    @user.delete_in_central
    @user.destroy

    if Cartodb::Central.sync_data_with_cartodb_central?
      redirect_to "http://www.cartodb.com"
    else
      render(file: "public/404.html", layout: false, status: 404)
    end
  rescue CartoDB::CentralCommunicationFailure => e
    Rollbar.report_message('Central error deleting user at CartoDB', 'error', { user: @user.inspect, error: e.inspect })
    flash.now[:error] = "Error deleting user: #{e.user_message}"
    render 'account'
  rescue => e
    Rollbar.report_message('Error deleting user at CartoDB', 'error', { user: @user.inspect, error: e.inspect })
    flash.now[:error] = "Error deleting user: #{e.message}"
    render 'account'
  end

  private

  def initialize_google_plus_config
    signup_action = Cartodb::Central.sync_data_with_cartodb_central? ? Cartodb::Central.new.google_signup_url : '/google/signup'
    @google_plus_config = ::GooglePlusConfig.instance(CartoDB, Cartodb.config, signup_action)
  end

  def get_oauth_services
    datasources = CartoDB::Datasources::DatasourcesFactory.get_all_oauth_datasources()
    array = []

    datasources.each do |serv|
      obj ||= Hash.new
      enabled = false
      title = ''
      revoke_url = ''
      
      case serv
        when 'gdrive'
          enabled = true if Cartodb.config[:oauth]['gdrive']['client_id'].present?
          title = 'Google Drive'
        when 'dropbox'
          enabled = true if Cartodb.config[:oauth]['dropbox']['app_key'].present?
          title = 'Dropbox'
        when 'mailchimp'
          enabled = true if Cartodb.config[:oauth]['mailchimp']['app_key'].present? && current_user.has_feature_flag?('mailchimp_import')
          title = 'MailChimp'
          revoke_url = 'http://admin.mailchimp.com/account/oauth2/'
        when 'instagram'
          enabled = true if Cartodb.config[:oauth]['instagram']['app_key'].present? && current_user.has_feature_flag?('instagram_import')
          title = 'Instagram'
          revoke_url = 'http://instagram.com/accounts/manage_access/'
        else
          enabled = true
          title = serv
      end

      if enabled
        oauth = @user.oauths.select(serv)

        obj['name'] = serv
        obj['title'] = title
        obj['revoke_url'] = revoke_url
        obj['connected'] = !oauth.nil? ? true : false

        array.push(obj)
      end
    end

    array
  end

  def setup_user
    @user = current_user
  end

end

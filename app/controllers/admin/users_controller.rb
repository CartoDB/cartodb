# coding: utf-8
require_relative '../../../lib/google_plus_api'
require_relative '../../../lib/google_plus_config'

class Admin::UsersController < ApplicationController
  ssl_required  :account, :profile, :account_update, :profile_update

  before_filter :get_config
  before_filter :login_required
  before_filter :initialize_google_plus_config, only: [:profile, :account]

  def get_config
    @extras_enabled = extras_enabled?
    @extra_geocodings_enabled = extra_geocodings_enabled?
    @extra_tweets_enabled = extra_tweets_enabled?
  end

  def initialize_google_plus_config
    signup_action = Cartodb::Central.sync_data_with_cartodb_central? ? Cartodb::Central.new.google_signup_url : '/google/signup'
    @google_plus_config = ::GooglePlusConfig.instance(Cartodb.config, signup_action)
  end

  def profile
    new_dashboard = current_user.has_feature_flag?('new_dashboard')

    unless new_dashboard
      redirect_to account_url and return
    end

    respond_to do |format|
      format.html { render 'profile', layout: 'new_application' }
    end
  end

  def account
    new_dashboard = current_user.has_feature_flag?('new_dashboard')

    unless new_dashboard
      redirect_to account_url and return
    end

    respond_to do |format|
      format.html { render 'account', layout: 'new_application' }
    end
  end

  def edit
    set_flash_flags
  end

  def set_flash_flags(show_dashboard_details_flash = nil, show_account_settings_flash = nil)
    @show_dashboard_details_flash = session[:show_dashboard_details_flash] || show_dashboard_details_flash
    @show_account_settings_flash = session[:show_account_settings_flash] || show_account_settings_flash
    session[:show_dashboard_details_flash] = nil
    session[:show_account_settings_flash] = nil
  end

  def account_update
    attributes = params[:user]
    current_user.set_fields(attributes, [:email]) if attributes[:email].present?

    current_user.save(raise_on_failure: true)

    redirect_to account_user_path(user_domain: params[:user_domain]), flash: { success: "Updated successfully" }
  rescue CartoDB::CentralCommunicationFailure => e
    set_flash_flags
    flash.now[:error] = "There was a problem while updating this user. Please, try again and contact us if the problem persists. #{e.user_message}"
    render action: :account
  rescue Sequel::ValidationFailed => e
    render action: :account
  end

  def profile_update
    attributes = params[:user]

    if attributes[:avatar_url].present?
      asset = Asset.new
      asset.raise_on_save_failure = true
      asset.user_id = current_user.id
      asset.asset_file = attributes[:avatar_url]
      asset.kind = Asset::KIND_ORG_AVATAR
      if asset.save
        current_user.avatar_url = asset.public_url
      end
    end

    current_user.set_fields(attributes, [:name]) if attributes[:name].present?
    current_user.set_fields(attributes, [:website]) if attributes[:website].present?
    current_user.set_fields(attributes, [:description]) if attributes[:description].present?
    current_user.set_fields(attributes, [:twitter_username]) if attributes[:twitter_username].present?
    current_user.set_fields(attributes, [:disqus_shortname]) if attributes[:disqus_shortname].present?
    current_user.set_fields(attributes, [:available_for_hire]) if attributes[:available_for_hire].present?

    current_user.update_in_central
    current_user.save(raise_on_failure: true)

    redirect_to profile_user_path(user_domain: params[:user_domain]), flash: { success: "Updated successfully" }
  rescue CartoDB::CentralCommunicationFailure => e
    set_flash_flags
    flash.now[:error] = "There was a problem while updating this user. Please, try again and contact us if the problem persists. #{e.user_message}"
    render action: :profile
  rescue Sequel::ValidationFailed => e
    flash.now[:error] = e.message
    render action: :profile
  end

  def extras_enabled?
    extra_geocodings_enabled? || extra_tweets_enabled?
  end

  def extra_geocodings_enabled?
    !Cartodb.get_config(:geocoder, 'app_id').blank?
  end

  def extra_tweets_enabled?
    !Cartodb.get_config(:datasource_search, 'twitter_search', 'standard', 'username').blank?
  end

  private

end

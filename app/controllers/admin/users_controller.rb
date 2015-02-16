# coding: utf-8
require_relative '../../../lib/google_plus_api'
require_relative '../../../lib/google_plus_config'

class Admin::UsersController < ApplicationController
  ssl_required :oauth, :api_key, :regenerate_api_key

  before_filter :login_required, :check_permissions
  before_filter :get_user, only: [:edit, :update, :destroy]
  before_filter :initialize_google_plus_config, only: [:edit, :update]

  def initialize_google_plus_config
    signup_action = Cartodb::Central.sync_data_with_cartodb_central? ? Cartodb::Central.new.google_signup_url : '/google/signup'
    @google_plus_config = GooglePlusConfig.instance(Cartodb.config, signup_action)
  end

  def new
    @user = User.new
    @user.quota_in_bytes = (current_user.organization.unassigned_quota < 100.megabytes ? current_user.organization.unassigned_quota : 100.megabytes)
  end

  def edit
    set_flash_flags
  end

  def set_flash_flags
    @show_dashboard_details_flash = session[:show_dashboard_details_flash]
    @show_account_settings_flash = session[:show_account_settings_flash]
    session[:show_dashboard_details_flash] = nil
    session[:show_account_settings_flash] = nil
  end

  def create
    @user = User.new
    @user.set_fields(params[:user], [:username, :email, :password, :quota_in_bytes, :password_confirmation, :twitter_datasource_enabled])
    @user.organization = current_user.organization
    @user.username = "#{@user.username}"
    copy_account_features(current_user, @user)
    @user.save(raise_on_failure: true)
    @user.create_in_central
    redirect_to organization_path(user_domain: params[:user_domain]), flash: { success: "New user created successfully" }
  rescue CartoDB::CentralCommunicationFailure => e
    Rollbar.report_exception(e)
    begin
      @user.destroy
    rescue => ee
      Rollbar.report_exception(ee)
    end
    set_flash_flags
    flash.now[:error] = e.user_message
    @user = User.new(username: @user.username, email: @user.email, quota_in_bytes: @user.quota_in_bytes, twitter_datasource_enabled: @user.twitter_datasource_enabled)
    render action: :new
  rescue Sequel::ValidationFailed => e
    render action: :new
  end

  def update
    session[:show_dashboard_details_flash] = params[:show_dashboard_details_flash].present?
    session[:show_account_settings_flash] = params[:show_account_settings_flash].present?

    attributes = params[:user]
    @user.set_fields(attributes, [:email]) if attributes[:email].present? && !@user.google_sign_in
    @user.set_fields(attributes, [:quota_in_bytes]) if current_user.organization_owner?

    @user.set_fields(attributes, [:disqus_shortname]) if attributes[:disqus_shortname].present?
    @user.set_fields(attributes, [:available_for_hire]) if attributes[:available_for_hire].present?
    @user.set_fields(attributes, [:name]) if attributes[:name].present?
    @user.set_fields(attributes, [:website]) if attributes[:website].present?
    @user.set_fields(attributes, [:description]) if attributes[:description].present?
    @user.set_fields(attributes, [:twitter_username]) if attributes[:twitter_username].present?

    @user.password = attributes[:password] if attributes[:password].present?
    @user.password_confirmation = attributes[:password_confirmation] if attributes[:password_confirmation].present?
    @user.soft_geocoding_limit = attributes[:soft_geocoding_limit] if attributes[:soft_geocoding_limit].present?
    @user.twitter_datasource_enabled = attributes[:twitter_datasource_enabled] if attributes[:twitter_datasource_enabled].present?
    @user.soft_twitter_datasource_limit = attributes[:soft_twitter_datasource_limit] if attributes[:soft_twitter_datasource_limit].present?
    @user.update_in_central

    @user.save(raise_on_failure: true)

    redirect_to edit_organization_user_path(user_domain: params[:user_domain], id: @user.username), flash: { success: "Updated successfully" }
  rescue CartoDB::CentralCommunicationFailure => e
    set_flash_flags
    flash.now[:error] = "There was a problem while updating this user. Please, try again and contact us if the problem persists. #{e.user_message}"
    render action: :edit
  rescue Sequel::ValidationFailed => e
    render action: :edit
  end

  def destroy
    @user.destroy
    head :no_content
  rescue CartoDB::CentralCommunicationFailure => e
    set_flash_flags
    flash.now[:error] = "There was a problem while deleting this user. Please, try again and contact us if the problem persists. #{e.user_message}"
    render action: :show
  end

  private

  def check_permissions
    raise RecordNotFound unless current_user.organization.present?
    raise RecordNotFound unless current_user.organization_owner? || ['edit', 'update'].include?(params[:action])
  end

  def get_user
    @user = current_user.organization.users_dataset.where(username: params[:id]).first
    raise RecordNotFound unless @user
    raise RecordNotFound unless current_user.organization_owner? || current_user == @user
  end

  def copy_account_features(from, to)
    to.set_fields(from, [
      :private_tables_enabled, :sync_tables_enabled, :max_layers, :user_timeout,
      :database_timeout, :geocoding_quota, :map_view_quota, :table_quota, :database_host,
      :period_end_date, :map_view_block_price, :geocoding_block_price, :account_type,
      :twitter_datasource_enabled, :soft_twitter_datasource_limit, :twitter_datasource_quota,
      :twitter_datasource_block_price, :twitter_datasource_block_size
    ])
    to.invite_token = User.make_token
  end
end

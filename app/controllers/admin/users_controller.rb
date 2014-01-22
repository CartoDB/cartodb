# coding: utf-8
class Admin::UsersController < ApplicationController
  ssl_required :oauth, :api_key, :regenerate_api_key

  before_filter :login_required, :check_permissions
  before_filter :get_user, only: [:edit, :update, :destroy]

  def new
    @user = User.new
    @user.quota_in_bytes = (current_user.organization.unassigned_quota < 100.megabytes ? current_user.organization.unassigned_quota : 100.megabytes)
  end

  def edit; end

  def create
    @user = User.new
    @user.set_fields(params[:user], [:username, :email, :password, :quota_in_bytes, :password_confirmation])
    @user.organization = current_user.organization
    @user.username = "#{@user.username}.#{current_user.organization.name}" unless @user.username =~ /\.#{current_user.organization.name}/
    copy_account_features(current_user, @user)
    @user.save(raise_on_failure: true)
    redirect_to organization_path, flash: { success: "New user created successfully" }
  rescue Sequel::ValidationFailed => e
    render action: :new
  end

  def update
    attributes = params[:user]
    @user.set_fields(attributes, [:email])
    @user.set_fields(attributes, [:quota_in_bytes]) if current_user.organization_owner
    @user.password = attributes[:password] if attributes[:password].present?
    @user.password_confirmation = attributes[:password_confirmation] if attributes[:password_confirmation].present?

    @user.save(raise_on_failure: true)
    redirect_to edit_organization_user_path(@user.username), flash: { success: "Updated successfully" }
  rescue Sequel::ValidationFailed => e
    render action: :edit
  end

  def destroy
    @user.destroy
    head :no_content
  end

  private

  def check_permissions
    raise RecordNotFound unless current_user.organization.present?
    raise RecordNotFound unless current_user.organization_owner || ['edit', 'update'].include?(params[:action])
  end

  def get_user
    @user = current_user.organization.users_dataset.where(username: params[:id]).first
    raise RecordNotFound unless @user
    raise RecordNotFound unless current_user.organization_owner || current_user == @user
  end

  def copy_account_features(from, to)
    to.set_fields(from, [
      :private_tables_enabled, :sync_tables_enabled, :max_layers, :user_timeout,
      :database_timeout, :geocoding_quota, :map_view_quota, :table_quota, :database_host,
      :period_end_date, :map_view_block_price, :geocoding_block_price, :account_type
    ])
    to.invite_token = User.make_token
  end
end

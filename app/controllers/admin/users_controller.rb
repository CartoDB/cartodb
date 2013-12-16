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
    @user.set_fields(params[:user], [:username, :email, :password, :quota_in_bytes])
    @user.organization = current_user.organization
    copy_account_features(current_user, @user)
    @user.save(raise_on_failure: true)
    redirect_to organization_path
  rescue Sequel::ValidationFailed => e
    render action: :new
  end

  def update
    attributes = params[:user]
    @user.set_fields(attributes, [:email])
    @user.set_fields(attributes, [:quota_in_bytes]) if current_user.organization_owner
    @user.password = attributes[:password] if attributes[:password].present?

    @user.save(raise_on_failure: true)
    redirect_to edit_organization_user_path(@user.username)
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
    to.private_tables_enabled = from.private_tables_enabled
    to.map_view_quota = from.map_view_quota
    to.table_quota    = from.table_quota
    to.database_host  = from.database_host
  end
end

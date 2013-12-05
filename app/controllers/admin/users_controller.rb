# coding: utf-8
class Admin::UsersController < ApplicationController
  ssl_required :oauth, :api_key, :regenerate_api_key

  before_filter :login_required, :check_permissions
  before_filter :get_user, only: [:edit, :update, :destroy]

  def new
    @user = User.new
    @user.set_only(
      organization: current_user.organization,
      private_tables_enabled: true
    )
  end

  def edit; end

  def create
    @user = User.new
    @user.set_fields(params[:user], [:username, :email, :password, :private_tables_enabled])
    @user.organization = current_user.organization
    @user.save(raise_on_failure: true)
    respond_with @user
  rescue ValidationFailed => e
    render action: new
  end

  def update
    attributes = params[:user]
    @user.set_fields(attributes, [:quota_in_bytes, :email])
    @user.password = attributes[:password] if attributes[:password].present?

    @user.save(raise_on_failure: true)
    redirect_to edit_organization_user_path(@user.username)
  rescue Sequel::ValidationFailed => e
    render action: :edit
  end

  def destroy
    @user.destroy
  end

  private

  def get_user
    @user = current_user.organization.users_dataset.where(username: params[:id]).first
    raise RecordNotFound unless @user
  end

  def check_permissions
    raise RecordNotFound unless current_user.organization.present? && current_user.organization_owner
  end
end

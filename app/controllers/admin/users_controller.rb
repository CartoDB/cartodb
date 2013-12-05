# coding: utf-8
class Admin::UsersController < ApplicationController
  ssl_required :oauth, :api_key, :regenerate_api_key

  before_filter :login_required, :check_permissions
  before_filter :get_user, only: [:show, :update, :destroy]

  def show
  end

  def create
    @user = User.new
    @user.set_fields(params[:user], [:username, :email, :password])
    @user.organization = current_user.organization
    @user.save
    respond_with @user
  end

  def update
    @user.set_fields(params[:user], [:quota_in_bytes, :email])
    if attributes[:password].present?
      @user.password              = attributes[:password]
    end

    @user.save
    respond_with @user
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
    not_authorized unless current_user.organization.present? && current_user.organization_owner
  end
end

# coding: utf-8
class Admin::UsersController < ApplicationController
  ssl_required :oauth, :api_key, :regenerate_api_key
  before_filter :login_required
  before_filter :get_user, only: [:show, :update, :destroy]

  def show
    not_authorized unless current_user.organization.present? && current_user.organization_owner
  end

  def create
    not_authorized unless current_user.organization.present? && current_user.organization_owner
  end

  def update
    not_authorized unless current_user.organization.present? && current_user.organization_owner
  end

  def destroy
    not_authorized unless current_user.organization.present? && current_user.organization_owner
    @user.destroy
  end

  private

  def get_user
    @user = current_user.organization.users_dataset.where(username: params[:id]).first
    raise RecordNotFound unless @user
  end
end

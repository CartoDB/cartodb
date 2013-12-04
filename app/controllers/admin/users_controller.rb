# coding: utf-8
class Admin::UsersController < ApplicationController
  ssl_required :oauth, :api_key, :regenerate_api_key
  before_filter :login_required

  def show
    not_authorized unless current_user.organization.present? && current_user.organization_owner
    @user = User.where(username: params[:id]).first
  end

  def update
    not_authorized unless current_user.organization.present? && current_user.organization_owner
  end
end

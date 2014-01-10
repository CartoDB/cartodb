# coding: utf-8
class Admin::OrganizationsController < ApplicationController
  ssl_required :oauth, :api_key, :regenerate_api_key
  before_filter :login_required

  def show
    @organization = current_user.organization
    raise RecordNotFound unless @organization.present? && current_user.organization_owner
    @users = current_user.organization.users
  end
end

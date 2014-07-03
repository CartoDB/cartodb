# coding: utf-8
class Admin::OrganizationsController < ApplicationController
  ssl_required :oauth, :api_key, :regenerate_api_key
  before_filter :login_required, :load_organization

  def show
    @users = current_user.organization.users
  end

  def settings
    @users = current_user.organization.users
  end

  def settings_update
    attributes = params[:organization]

    @organization.avatar_url = attributes[:avatar_url] if attributes.include?(:avatar_url)
    @organization.website = attributes[:website]
    @organization.description = attributes[:description]
    @organization.display_name = attributes[:display_name]
    @organization.discus_shortname = attributes[:discus_shortname]
    @organization.twitter_username = attributes[:twitter_username]
    @organization.save(raise_on_failure: true)

    redirect_to organization_settings_path(user_domain: params[:user_domain]), flash: { success: "Updated successfully" }
  rescue Sequel::ValidationFailed => e
    render action: :settings
  end

  private

  def load_organization
    @organization = current_user.organization
    raise RecordNotFound unless @organization.present? && current_user.organization_owner?
  end

end

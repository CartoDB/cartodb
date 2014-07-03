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

    if attributes.include?(:avatar_url)
      asset = Asset.new
      asset.raise_on_save_failure = true
      asset.user_id = current_user.id
      asset.asset_file = attributes[:avatar_url]
      asset.kind = Asset::KIND_ORG_AVATAR
      if asset.save
        @organization.avatar_url = asset.public_url
      end
    end

    @organization.website = attributes[:website]
    @organization.description = attributes[:description]
    @organization.display_name = attributes[:display_name]
    @organization.discus_shortname = attributes[:discus_shortname]
    @organization.twitter_username = attributes[:twitter_username]

    @organization.update_in_central
    @organization.save(raise_on_failure: true)

    redirect_to organization_settings_path(user_domain: params[:user_domain]), flash: { success: "Updated successfully" }
  rescue CartoDB::CentralCommunicationFailure => e
    flash[:error] = "There was a problem while updating your organization. Please, try again and contact us if the problem persists."
    render action: :settings
  rescue Sequel::ValidationFailed => e
    flash[:error] = e.message
    render action: :settings
  end

  private

  def load_organization
    @organization = current_user.organization
    raise RecordNotFound unless @organization.present? && current_user.organization_owner?
  end

end

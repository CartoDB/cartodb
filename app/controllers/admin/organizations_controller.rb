# coding: utf-8
class Admin::OrganizationsController < ApplicationController
  ssl_required :oauth, :api_key, :regenerate_api_key
  before_filter :login_required, :load_organization_and_members

  def show
    new_dashboard = current_user.has_feature_flag?('new_dashboard')
    view =  new_dashboard ? 'new_show' : 'show'
    layout = new_dashboard ? 'new_application' : 'application'

    respond_to do |format|
      format.html { render view, layout: layout }
    end
  end

  def settings
    new_dashboard = current_user.has_feature_flag?('new_dashboard')
    view =  new_dashboard ? 'new_settings' : 'settings'
    layout = new_dashboard ? 'new_application' : 'application'

    respond_to do |format|
      format.html { render view, layout: layout }
    end
  end

  def settings_update
    new_dashboard = current_user.has_feature_flag?('new_dashboard')
    view =  new_dashboard ? 'new_settings' : 'settings'
    layout = new_dashboard ? 'new_application' : 'application'

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

    redirect_to CartoDB.url(self, 'organization_settings', {}, current_user), flash: { success: "Updated successfully" }
  rescue CartoDB::CentralCommunicationFailure => e
    @organization.reload
    flash.now[:error] = "There was a problem while updating your organization. Please, try again and contact us if the problem persists. #{e.user_message}"
    render action: view, layout: layout
  rescue Sequel::ValidationFailed => e
    flash.now[:error] = e.message
    render action: view, layout: layout
  end

  private

  def load_organization_and_members
    @organization = current_user.organization
    @users = current_user.organization.users
    raise RecordNotFound unless @organization.present? && current_user.organization_owner?
  end

end

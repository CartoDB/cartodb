# coding: utf-8
class Admin::OrganizationsController < ApplicationController
  ssl_required :settings, :settings_update
  before_filter :login_required, :load_organization_and_members

  layout 'application'

  def show
    respond_to do |format|
      format.html { render 'show' }
    end
  end

  def settings
    respond_to do |format|
      format.html { render 'settings' }
    end
  end

  def settings_update
    attributes = params[:organization]

    if attributes.include?(:avatar_url)
      @organization.avatar_url = attributes[:avatar_url]
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
    render action: 'settings'
  rescue Sequel::ValidationFailed => e
    flash.now[:error] = e.message
    render action: 'settings'
  end

  private

  def load_organization_and_members
    @organization = current_user.organization
    @users = current_user.organization.users
    raise RecordNotFound unless @organization.present? && current_user.organization_owner?
  end

end

# coding: utf-8
class Admin::OrganizationsController < ApplicationController
  ssl_required :show, :settings, :settings_update
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
    @organization.color = attributes[:color]
    @organization.whitelisted_email_domains = attributes[:whitelisted_email_domains].split(",")
    if attributes.include?(:default_quota_in_bytes)
      default_quota_in_bytes = attributes[:default_quota_in_bytes]
      @organization.default_quota_in_bytes = default_quota_in_bytes.blank? ? nil : default_quota_in_bytes.to_i * 1024 * 1024
    end
    @organization.discus_shortname = attributes[:discus_shortname]
    @organization.twitter_username = attributes[:twitter_username]

    @organization.update_in_central
    @organization.save(raise_on_failure: true)

    redirect_to CartoDB.url(self, 'organization_settings', {}, current_user), flash: { success: "Your changes have been saved correctly." }
  rescue CartoDB::CentralCommunicationFailure => e
    @organization.reload
    flash.now[:error] = "There was a problem while updating your organization. Please, try again and contact us if the problem persists. #{e.user_message}"
    render action: 'settings'
  rescue Sequel::ValidationFailed => e
    flash.now[:error] = "There's been a validation error, check your values"
    render action: 'settings'
  end

  def regenerate_all_api_keys
    @organization.users.each { |user|
      user.regenerate_api_key
    }
    flash[:success] = "Users API keys regenerated successfully"
    render action: 'settings'
  rescue => e
    CartoDB.notify_exception(e, { organization: @organization.id, current_user: current_user.id })
    flash[:error] = "There was an error regenerating the API keys. Please, try again and contact us if the problem persists"
    render action: 'settings'
  end

  private

  def load_organization_and_members
    @organization = current_user.organization
    raise RecordNotFound unless @organization.present? && current_user.organization_owner?
  end

end

# coding: utf-8
require_relative '../../../lib/google_plus_api'
require_relative '../../../lib/google_plus_config'

class Admin::UsersController < ApplicationController
  ssl_required  :account, :profile, :account_update, :profile_update

  before_filter :login_required
  before_filter :setup_user
  before_filter :initialize_google_plus_config, only: [:profile, :account]

  def initialize_google_plus_config
    signup_action = Cartodb::Central.sync_data_with_cartodb_central? ? Cartodb::Central.new.google_signup_url : '/google/signup'
    # TODO: Uncomment when going to test G+ auth, else goes crazy with requires and every change requires restarting Rails
    #@google_plus_config = ::GooglePlusConfig.instance(Cartodb.config, signup_action)
  end

  def profile
    unless @user.has_feature_flag?('new_dashboard')
      redirect_to account_url and return
    end

    respond_to do |format|
      format.html { render 'profile', layout: 'new_application' }
    end
  end

  def account
    unless @user.has_feature_flag?('new_dashboard')
      redirect_to account_url and return
    end

    respond_to do |format|
      format.html { render 'account', layout: 'new_application' }
    end
  end

  def account_update
    attributes = params[:user]
    @user.set_fields(attributes, [:email]) if attributes[:email].present?
    @user.change_password(attributes[:old_password].presence, attributes[:new_password].presence,
                                 attributes[:confirm_password].presence)
    @user.update_in_central
    @user.save(raise_on_failure: true)

    redirect_to account_user_path(user_domain: params[:user_domain]), flash: { success: "Updated successfully" }
  rescue CartoDB::CentralCommunicationFailure => e
    Rollbar.report_exception(e, params, @user)
    flash.now[:error] = "There was a problem while updating your data. Please, try again and contact us if the problem persists"
    render action: :account, layout: 'new_application'
  rescue Sequel::ValidationFailed => e
    flash.now[:error] = "Error updating your account details"
    render action: :account, layout: 'new_application'
  end

  def profile_update
    attributes = params[:user]

    if attributes[:avatar_url].present?
      asset = Asset.new
      asset.raise_on_save_failure = true
      asset.user_id = @user.id
      asset.asset_file = attributes[:avatar_url]
      asset.kind = Asset::KIND_ORG_AVATAR
      if asset.save
        @user.avatar_url = asset.public_url
      end
    end

    # This fields are optional
    @user.name = attributes.fetch(:name, nil)
    @user.website = attributes.fetch(:website, nil)
    @user.description = attributes.fetch(:description, nil)
    @user.twitter_username = attributes.fetch(:twitter_username, nil)
    @user.disqus_shortname = attributes.fetch(:disqus_shortname, nil)

    @user.set_fields(attributes, [:available_for_hire]) if attributes[:available_for_hire].present?

    @user.update_in_central
    @user.save(raise_on_failure: true)

    redirect_to profile_user_path(user_domain: params[:user_domain]), flash: { success: "Updated successfully" }
  rescue CartoDB::CentralCommunicationFailure => e
    Rollbar.report_exception(e, params, @user)
    flash.now[:error] = "There was a problem while updating your data. Please, try again and contact us if the problem persists"
    render action: :profile, layout: 'new_application'
  rescue Sequel::ValidationFailed => e
    flash.now[:error] = "Error updating your profile details"
    render action: :profile, layout: 'new_application'
  end

  private

  def setup_user
    @user = current_user
  end

end

# coding: utf-8
require_relative '../helpers/avatar_helper'

class Admin::MobileAppsController < Admin::AdminController
  include AvatarHelper

  ssl_required :new, :create, :update, :destroy
  before_filter :invalidate_browser_cache, :login_required, :central_configuration_present?

  layout 'application'

  def index
    @mobile_apps = []

    respond_to do |format|
      format.html { render 'index' }
    end
  end

  def new
    @icon_valid_extensions = AVATAR_VALID_EXTENSIONS
    @mobile_app = MobileApp.new

    respond_to do |format|
      format.html { render 'new' }
    end
  end

  def create
    redirect_to CartoDB.url(self, 'mobile_apps', {}, current_user), :flash => {:success => "Your app has been added succesfully!"}
  end

  def edit
  end

  def update
  end


  def destroy
  end

  private

  def central_configuration_present?
    render_404 and return unless Cartodb::Central.sync_data_with_cartodb_central?
  end

end

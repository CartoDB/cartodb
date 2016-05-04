# coding: utf-8
require_relative '../helpers/avatar_helper'

class Admin::MobileAppsController < Admin::AdminController
  include AvatarHelper

  ssl_required :new, :create, :update, :destroy
  before_filter :invalidate_browser_cache, :login_required, :central_configuration_present?
  before_filter :cartodb_central_client, only: [:index, :create, :update, :destroy]

  layout 'application'

  def index
    @mobile_apps = @cartodb_central_client.get_mobile_apps(current_user.username).map { |a| MobileApp.new(a) };

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
    @cartodb_central_client.create_mobile_app(current_user.username, params[:mobile_app].merge(license_key: "appkey"))

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

  def cartodb_central_client
    @cartodb_central_client ||= Cartodb::Central.new
  end

end

# coding: UTF-8

class Admin::ClientApplicationsController < ApplicationController

  before_filter :login_required

  def oauth
    @client_application = current_user.client_application
  end

  def jsonp
    @api_keys = APIKey.filter(:user_id => current_user.id).all
    @api_key = APIKey.new :user_id => current_user.id
    return if request.get?
    @api_key.domain = params[:api_key][:domain]
    if @api_key.save
      redirect_to jsonp_credentials_path, :flash => {:success => "Your API key has been created successfully"}
    else
      render :action => "jsonp"
    end
  end

  def remove_api_key
    return if request.get?
    if api_key = APIKey.filter(:user_id => current_user.id, :id => params[:id])
      api_key.destroy
      redirect_to jsonp_credentials_path, :flash => {:success => "API key has been removed successfully"}
    end
  end

end

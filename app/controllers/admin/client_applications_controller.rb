# coding: utf-8 

class Admin::ClientApplicationsController < ApplicationController
  ssl_required :oauth, :api_key, :remove_api_key

  before_filter :login_required

  def oauth
    @client_application = current_user.client_application
    return if request.get?
    current_user.reset_client_application!
    redirect_to oauth_credentials_path, :flash => {:success => "Your OAuth credentials have been updated successuflly"}
  end

  def api_key
  end

  def regenerate_api_key
    current_user.regenerate_map_key
    redirect_to api_key_credentials_path, :flash => {:success => "Your API key has been regenerated successfully"}
  end

end

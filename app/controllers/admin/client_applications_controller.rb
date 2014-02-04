# coding: utf-8

class Admin::ClientApplicationsController < ApplicationController
  ssl_required :oauth, :api_key, :regenerate_api_key

  before_filter :login_required

  def oauth
    @client_application = current_user.client_application
    return if request.get?
    current_user.reset_client_application!
    redirect_to api_key_credentials_path(type: 'oauth'), :flash => {:success => "Your OAuth credentials have been updated successuflly"}
  end

  def api_key
  end

  def regenerate_api_key
    begin
      current_user.invalidate_varnish_cache
      current_user.update api_key: User.make_token
      flash_message = "Your API key has been successfully generated"
    rescue Errno::ECONNREFUSED => e
      CartoDB::Logger.info "Could not clear varnish cache", "#{e.inspect}"
      if Rails.env.development?
        current_user.set_map_key
        flash_message = "Your API key has been regenerated succesfully but the varnish cache has not been invalidated."
      else
        raise e
      end
    rescue => e
      raise e
    end 
    redirect_to api_key_credentials_path(type: 'api_key'), :flash => {:success => "Your API key has been regenerated successfully"}
  end

end

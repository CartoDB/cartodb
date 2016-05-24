# coding: utf-8

class Admin::ClientApplicationsController < Admin::AdminController
  ssl_required :oauth, :api_key, :regenerate_api_key, :regenerate_oauth

  before_filter :invalidate_browser_cache
  before_filter :login_required

  layout 'application'

  def oauth
    respond_to do |format|
      format.html { render 'oauth' }
    end
  end

  def api_key
    respond_to do |format|
      format.html { render 'api_key' }
    end
  end

  def regenerate_api_key
    begin
      current_user.regenerate_api_key
    rescue Errno::ECONNREFUSED => e
      CartoDB::StdoutLogger.info "Could not clear varnish cache", "#{e.inspect}"
      if Rails.env.development?
        current_user.set_map_key
        error_message = "Your API key has been regenerated succesfully but the varnish cache has not been invalidated."
      else
        raise e
      end
    rescue CartoDB::CentralCommunicationFailure => e
      CartoDB::Logger.warning(exception: e, message: 'Error updating API key in mobile apps')
      error_message = "Your API key has been successfully generated, " \
                      "but there was an error updating the license keys of mobile apps"
    rescue => e
      raise e
    end

    flash = if error_message
              { error: error_message }
            else
              { success: "Your API key has been regenerated successfully" }
            end
    redirect_to CartoDB.url(self, 'api_key_credentials', { type: 'api_key' }, current_user), flash: flash
  end

  def regenerate_oauth
    @client_application = current_user.client_application
    return if request.get?
    current_user.reset_client_application!

    redirect_to CartoDB.url(self, 'oauth_credentials', {type: 'oauth'}, current_user),
                :flash => {:success => "Your OAuth credentials have been updated successfully"}
  end
end

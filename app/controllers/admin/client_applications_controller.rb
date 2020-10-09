require_relative './../helpers/organization_notifications_helper'

class Admin::ClientApplicationsController < Admin::AdminController
  include OrganizationNotificationsHelper

  ssl_required :oauth, :api_key, :regenerate_api_key, :regenerate_oauth

  before_filter :invalidate_browser_cache
  before_filter :login_required
  before_filter :enforce_engine_enabled, only: :regenerate_api_key
  before_filter :load_dashboard_notifications, only: :api_key
  before_filter :load_organization_notifications, only: :api_key

  layout 'application'

  def oauth
    respond_to do |format|
      format.html { render 'oauth' }
    end
  end

  def api_key
    @has_engine_enabled = current_user.engine_enabled?

    respond_to do |format|
      format.html { render 'api_key' }
    end
  end

  def regenerate_api_key
    begin
      current_user.regenerate_api_key
    rescue Errno::ECONNREFUSED => e
      log_info(message: "Could not clear varnish cache", exception: e)
      if Rails.env.development?
        current_user.set_map_key
        error_message = "Your API key has been regenerated succesfully but the varnish cache has not been invalidated."
      else
        raise e
      end
    rescue CartoDB::CentralCommunicationFailure => e
      log_warning(exception: e, message: 'Error updating API key in mobile apps')
      error_message = "Your API key has been successfully generated, " \
                      "but there was an error updating the license keys of mobile apps"
    end

    flash = if error_message
              { error: error_message }
            else
              { success: "Your API key has been regenerated successfully" }
            end
    redirect_to CartoDB.url(self, 'api_key_credentials', params: { type: 'api_key' }, user: current_user), flash: flash
  end

  def regenerate_oauth
    @client_application = current_user.client_application
    return if request.get?

    current_user.reset_client_application!

    redirect_to CartoDB.url(self, 'oauth_credentials', params: { type: 'oauth' }, user: current_user),
                flash: { success: "Your OAuth credentials have been updated successfully" }
  end

  private
  def enforce_engine_enabled
    unless current_user.engine_enabled?
      render_403
    end
  end

  def load_dashboard_notifications
    carto_user = Carto::User.where(id: current_user.id).first if current_user

    @dashboard_notifications = carto_user ? carto_user.notifications_for_category(:dashboard) : {}
  end
end

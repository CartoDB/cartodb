# coding: utf-8

class Admin::ClientApplicationsController < ApplicationController
  ssl_required :oauth, :api_key, :regenerate_api_key

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
    require 'net/telnet'
    varnish_host = APP_CONFIG[:varnish_management].try(:[],'host') || '127.0.0.1'
    varnish_port = APP_CONFIG[:varnish_management].try(:[],'port') || 6082
    begin
      varnish_conn = Net::Telnet.new("Host" => varnish_host, "Port" => varnish_port, "Prompt" => /200 0/)
      varnish_conn.cmd("purge obj.http.X-Cache-Channel ~ #{current_user.database_name}.*")
      varnish_conn.close
      current_user.set_map_key
      flash_message = "Your API key has been regenerated successfully"
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
    redirect_to api_key_credentials_path, :flash => {:success => flash_message}
  end

end

# encoding: UTF-8

class NotificationsController < ApplicationController

  def unsubscribe
    username = CartoDB.extract_subdomain(request)
    user = Carto::User.where(:username => username).first
    if user.nil?
      # TODO Send error
    else
      ok = user.unsubscribe_notification(params[:notification_hash])
      respond_to do |format|
        format.html { render 'unsubscribed' }
      end
    end
  end
end

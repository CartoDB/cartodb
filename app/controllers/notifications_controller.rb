# encoding: UTF-8

class NotificationsController < ApplicationController

  def unsubscribe
    username = CartoDB.extract_subdomain(request)
    user = Carto::User.where(:username => username).first
    if user.nil?
      respond_to do |format|
        format.html { render 'error' }
      end
    else
      type = Carto::UserNotification.verify_hash(user)
      if type.nil?
        respond_to do |format|
          format.html { render 'error' }
        end
      else
        ok = user.unsubscribe_notification(type)
        respond_to do |format|
          format.html { render 'unsubscribed' }
        end
      end
    end
  end
end

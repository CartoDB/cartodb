# encoding: UTF-8

class NotificationsController < ApplicationController

  before_filter :load_user_by_subdomain

  def unsubscribe
    type = Carto::UserNotification.verify_hash(@user, params[:notification_hash])
    return render(text: "Not authorized", status: :unauthorized) if type.nil?
    response = (@user.unsubscribe_notification(type)) ? :ok : :bad_request
    return render(text: "", status: response)
  end

  def load_user_by_subdomain
    username = CartoDB.extract_subdomain(request)
    @user = Carto::User.where(:username => username).first
    return render(text: "Not authorized", status: :unauthorized) if @user.nil?
  end
end

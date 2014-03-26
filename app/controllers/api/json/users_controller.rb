class Api::Json::UsersController < Api::ApplicationController

  if Rails.env.production? || Rails.env.staging?
    ssl_required :show
  end

  def show
    user = current_user
    render :json => user.data
  end

  def get_authenticated_users
    render :json => request.session.select {|k,v| k.start_with?("warden.user")}.values
  end

end

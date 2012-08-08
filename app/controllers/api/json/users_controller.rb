class Api::Json::UsersController < Api::ApplicationController

  if Rails.env.production? || Rails.env.staging?
    ssl_required :show
  end

  def show
    user = User.filter({ :username => params[:id] }).first || User[params[:id]]
    render :json => user.data
  end
end

class Api::Json::PermissionsController < Api::ApplicationController

  if Rails.env.production? || Rails.env.staging?
    ssl_required :show
  end

  def update
    # TODO: code
    render json: params[:id]
  end

  def show
    # TODO: code
    render json: params[:id]
  end

end

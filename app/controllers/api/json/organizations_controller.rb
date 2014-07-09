# encoding: utf-8

class Api::Json::OrganizationsController < Api::ApplicationController
  include CartoDB

  if Rails.env.production? || Rails.env.staging?
    ssl_required :show, :users
  end

  # Fetch info from the current user orgranization
  def show
    render json: {}.to_json if current_user.organization.nil?

    render json: current_user.organization.to_poro
  end

  # Return user list of current user organization
  def users
    render json: {}.to_json if current_user.organization.nil?
    
    render json: current_user.organization.to_poro[:users]
  end

end

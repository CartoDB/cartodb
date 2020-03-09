class Api::Json::OrganizationsController < Api::ApplicationController
  include CartoDB

  ssl_required :show, :users

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

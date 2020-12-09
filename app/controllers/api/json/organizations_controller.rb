class Api::Json::OrganizationsController < Api::ApplicationController
  include CartoDB

  ssl_required :show, :users

  # Fetch info from the current user orgranization
  def show
    data = current_user.organization ? organization_presenter.to_poro : {}

    render json: data
  end

  # Return user list of current user organization
  def users
    data = current_user.organization ? organization_presenter.to_poro[:users] : {}

    render json: data
  end

  private

  def organization_presenter
    ::OrganizationPresenter.new(current_user.organization)
  end

end

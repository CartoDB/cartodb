module Superadmin
  class OrganizationsController < ::Superadmin::SuperadminController

    respond_to :json
    ssl_required :show, :index
    layout 'application'

    def show
      organization = Carto::Organization.find_by(id: params[:id])

      render(json: { error: 'Organization not found' }, status: :not_found) unless organization
      respond_with(::OrganizationPresenter.new(organization, extended: true).data)
    end

    def index
      organizations = params[:overquota].present? ? Carto::Organization.overquota(0.20) : Carto::Organization.all
      organizations_data = organizations.map { |organization| ::OrganizationPresenter.new(organization) }.map(&:data)

      respond_with(:superadmin, organizations_data)
    end

  end
end

class Superadmin::OrganizationsController < Superadmin::SuperadminController
  respond_to :json

  ssl_required :show, :create, :update, :destroy, :index
  before_filter :get_organization, only: [:update, :destroy, :show]

  layout 'application'

  def show
    respond_with(::OrganizationPresenter.new(@organization, extended: true).data)
  end

  def index
    organizations = params[:overquota].present? ? Carto::Organization.overquota(0.20) : Carto::Organization.all
    organizations_data = organizations.map { |organization| ::OrganizationPresenter.new(organization) }.map(&:data)

    respond_with(:superadmin, organizations_data)
  end

  private

  def get_organization
    @organization = Carto::Organization.find_by(id: params[:id])
    render json: { error: 'Organization not found' }, status: 404 unless @organization
  end

end

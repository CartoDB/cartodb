class Superadmin::OrganizationsController < Superadmin::SuperadminController
  respond_to :json

  ssl_required :show, :create, :update, :destroy, :index if Rails.env.production? || Rails.env.staging?
  before_filter :get_organization, only: [:update, :destroy, :show]

  layout 'application'

  ALLOWED_ATTRIBUTES = [
    :name, :seats, :quota_in_bytes
  ]

  def show
    respond_with(@organization.data(:extended => true))
  end

  def index
    @organizations = Organization.all
    respond_with(:superadmin, @organizations.map(&:data))
  end

  def create
    @organization = Organization.new
    attributes = params[:organization]

    @organization.set_only(attributes, ALLOWED_ATTRIBUTES)

    @organization.save
    respond_with(:superadmin, @organization)
  end

  def update
    attributes = params[:organization]
    @organization.set_only(attributes, ALLOWED_ATTRIBUTES)

    @organization.save
    respond_with(:superadmin, @organization)
  end

  def destroy
    @organization.destroy
    respond_with(:superadmin, @organization)
  end

  private

  def get_organization
    @organization = Organization[params[:id]]
    raise RecordNotFound unless @organization
  end # get_organization

end
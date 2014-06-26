class Superadmin::OrganizationsController < Superadmin::SuperadminController
  respond_to :json

  ssl_required :show, :create, :update, :destroy, :index if Rails.env.production? || Rails.env.staging?
  before_filter :get_organization, only: [:update, :destroy, :show]

  layout 'application'

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

    @organization.set_only(attributes, Organization::ALLOWED_API_ATTRIBUTES)
    set_owner_if_present(attributes)

    @organization.save
    respond_with(:superadmin, @organization)
  end

  def update
    attributes = params[:organization]

    @organization.set_only(attributes, Organization::ALLOWED_API_ATTRIBUTES)
    set_owner_if_present(attributes)

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

  def set_owner_if_present(attributes)
    @organization.owner_id = attributes[:owner_id] unless attributes[:owner_id].blank?
  end

end
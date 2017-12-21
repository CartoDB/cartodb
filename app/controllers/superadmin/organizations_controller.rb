class Superadmin::OrganizationsController < Superadmin::SuperadminController
  respond_to :json

  ssl_required :show, :create, :update, :destroy, :index
  before_filter :get_organization, only: [:update, :destroy, :show]

  layout 'application'

  def show
    respond_with(@organization.data(:extended => true))
  end

  def index
    @organizations = (params[:overquota].present? ? Organization.overquota(0.20) : Organization.all)

    respond_with(:superadmin, @organizations.map(&:data))
  end

  def create
    @organization = Organization.new
    @organization.set_fields_from_central(params[:organization], :create)
    if @organization.save && params[:organization][:owner_id].present? && @organization.owner.nil?
      # TODO: move this into a callback or a model method
      uo = CartoDB::UserOrganization.new(@organization.id, params[:organization][:owner_id])
      uo.promote_user_to_admin
    end
    respond_with(:superadmin, @organization)
  rescue => e
    begin
      @organization.delete if @organization && @organization.id
    rescue => ee
      # Avoid shadowing original error
      CartoDB.notify_error('Cleaning failed creation', error: ee.inspect, organization: @organization)
    end
    CartoDB.notify_error('Error creating organization', error: e.inspect, organization: @organization)
    respond_with(:superadmin, @organization, errors: [e.inspect], status: 500)
  end

  def update
    @organization.set_fields_from_central(params[:organization], :update)
    @organization.save
    respond_with(:superadmin, @organization)
  end

  def destroy
    @organization.destroy_cascade(delete_in_central: false)
    respond_with(:superadmin, @organization)
  rescue => e
    CartoDB::Logger.error(exception: e, message: 'Error deleting organization', organization: @organization)
    render json: { errors: [e.inspect] }, status: 500
  end

  private

  def get_organization
    @organization = Organization[params[:id]]
    render json: { error: 'Organization not found' }, status: 404 unless @organization
  end # get_organization

end

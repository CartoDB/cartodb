class Superadmin::UsersController < Superadmin::SuperadminController
  respond_to :json

  ssl_required :show, :create, :update, :destroy, :index if Rails.env.production? || Rails.env.staging?
  before_filter :get_user, only: [:update, :destroy, :show]

  layout 'application'

  def show
    respond_with(@user.data(:extended => true))
  end

  def index
    @users = (params[:overquota].present? ? User.overquota(0.20) : User.all)
    respond_with(:superadmin, @users.map(&:data))
  end

  def create
    @user = User.new
    attributes = params[:user]

    @user.set_only(attributes, User::ALLOWED_API_ATTRIBUTES)
    @user.enabled = true
    set_password_if_present(attributes)
    set_organization_if_present(attributes)

    @user.save
    respond_with(:superadmin, @user)
  end

  def update
    attributes = params[:user]

    @user.set_only(attributes, User::ALLOWED_API_ATTRIBUTES)
    set_password_if_present(attributes)
    set_organization_if_present(attributes)

    @user.save
    respond_with(:superadmin, @user)
  end

  def destroy
    @user.destroy
    respond_with(:superadmin, @user)
  end

  private

  def get_user
    @user = User[params[:id]]
    raise RecordNotFound unless @user
  end # get_user

  def set_password_if_present(attributes)
    @user.password         = attributes[:password] if attributes[:password].present?
    @user.password_confirmation = attributes[:password] if attributes[:password].present?
    @user.crypted_password = attributes[:crypted_password] if attributes[:crypted_password].present?
    @user.salt             = attributes[:salt] if attributes[:salt].present?
  end # set_password_if_present

  def set_organization_if_present(attributes)
    @user.organization_id = attributes[:organization_id] unless attributes[:organization_id].blank?
  end

end # Superadmin::UsersController

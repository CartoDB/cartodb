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

    @user.set_fields_from_central(params[:user], :create)
    @user.enabled = true

    @user.save
    respond_with(:superadmin, @user)
  end

  def update
    attributes = params[:user]

    @user.set_fields_from_central(params[:user], :update)

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

end # Superadmin::UsersController

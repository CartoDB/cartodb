class Superadmin::UsersController < Superadmin::SuperadminController
  respond_to :json

  ssl_required :show, :create, :update, :destroy, :index if Rails.env.production? || Rails.env.staging?
  before_filter :get_user, only: [:update, :destroy, :show]

  layout 'application'

  ALLOWED_ATTRIBUTES = [
    :username, :email, :admin, :quota_in_bytes, :table_quota, :account_type,
    :private_tables_enabled, :sync_tables_enabled, :map_view_quota, :map_view_block_price,
    :geocoding_quota, :geocoding_block_price, :period_end_date, :max_layers, :user_timeout,
    :database_timeout, :database_host, :upgraded_at, :notification, :organization_owner,
    :disqus_shortname
  ]

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
    @user.set_only(attributes, ALLOWED_ATTRIBUTES)
    @user.enabled = true
    set_password_if_present(attributes)

    @user.save
    respond_with(:superadmin, @user)
  end

  def update
    attributes = params[:user]
    @user.set_only(attributes, ALLOWED_ATTRIBUTES)
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
    return if attributes[:organization_attributes].blank?
    organization = (@user.organization.blank? ? Organization.new : @user.organization)
    organization.set_only(attributes[:organization_attributes], [:name, :seats, :quota_in_bytes])
    organization.save
    @user.organization = organization
  end
end # Superadmin::UsersController

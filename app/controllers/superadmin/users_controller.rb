class Superadmin::UsersController < Superadmin::SuperadminController
  respond_to :json

  ssl_required :create, :update, :destroy, :show, :index if Rails.env.production? || Rails.env.staging?

  before_filter :get_user, :only => [:update, :destroy, :show, :edit]

  layout 'application'

  def index
  end

  def new
    @user = User.new
    @user.table_quota = nil
    @user.private_tables_enabled = true
  end

  def edit
  end

  def index
    @users = (params[:overquota].present? ? User.overquota(0.20) : User.all)
    respond_with(:superadmin, @users.map(&:data))
  end

  def create
    # BEWARE. don't get clever. This is all explicit because of mass assignment limitations
    @user = User.new
    @user.set_only(params[:user], [
      :username, :email, :admin, :quota_in_bytes, :table_quota, :account_type
      :private_tables_enabled, :sync_tables_enabled, :map_view_quota, :map_view_block_price
      :geocoding_quota, :geocoding_block_price, :period_end_date, :max_layers, :user_timeout
      :database_timeout, :database_host, :upgraded_at, :notification
    ])
    @user.enabled = true

    if params[:user][:password].present?
      @user.password              = attributes[:password]
    else
      @user.crypted_password      = attributes[:crypted_password]
      @user.salt                  = attributes[:salt]
    end

    @user.save
    respond_to do |format|
      format.json { with(:superadmin, @user) }
      format.html { 
        redirect_to superadmin_root_path, flash: { success: (@user.valid? ? "OK" : "FAIL #{@user.errors.full_messages}") }
      }
    end
  end

  def update
    @user.set_only(params[:user], [
      :username, :email, :admin, :quota_in_bytes, :table_quota, :account_type
      :private_tables_enabled, :sync_tables_enabled, :map_view_quota, :map_view_block_price
      :geocoding_quota, :geocoding_block_price, :period_end_date, :max_layers, :user_timeout
      :database_timeout, :database_host, :upgraded_at, :notification
    ])

    if params[:user][:password].present?
      @user.password = attributes[:password]
    else
      @user.crypted_password      = params[:user][:crypted_password] if params[:user].has_key?(:crypted_password)
      @user.salt                  = params[:user][:salt] if attributes.has_key?(:salt)
    end

    # check for quota update
    quota_changed = @user.changed_columns.include?(:quota_in_bytes) ? true : false

    # commit changes to user
    @user.save

    # if quota has been updated, update all the quota checking triggers too
    if quota_changed
      @user.rebuild_quota_trigger
      CartoDB::Logger.info "rebuild quota triggers for #{@user.username}"
    end

    respond_with(:superadmin, @user)
  end

  def destroy
    @user.destroy
    respond_with(:superadmin, @user)
  end

  def show
    respond_with(@user.data(:extended => true))
  end

  private

  def get_user
    @user = User[params[:id]] if params[:id]
  end
end

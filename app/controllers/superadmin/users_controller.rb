class Superadmin::UsersController < Superadmin::SuperadminController
  respond_to :json

  ssl_required :create, :update, :destroy, :show, :index if Rails.env.production? || Rails.env.staging?
  before_filter :get_user, :only => [:update, :destroy, :show]

  def index
    @users = (params[:overquota].present? ? User.overquota(0.20) : User.all)
    respond_with(:superadmin, @users.map(&:data))
  end

  def create
    # BEWARE. don't get clever. This is all explicit because of mass assignment limitations
    @user = User.new

    if attributes = params[:user]
      @user.username                = attributes[:username]
      @user.email                   = attributes[:email]
      @user.admin                   = attributes[:admin]
      @user.enabled                 = true
      @user.map_enabled             = attributes[:map_enabled]              if attributes.has_key?(:map_enabled)
      @user.quota_in_bytes          = attributes[:quota_in_bytes]           if attributes.has_key?(:quota_in_bytes)
      @user.table_quota             = attributes[:table_quota]              if attributes.has_key?(:table_quota)
      @user.account_type            = attributes[:account_type]             if attributes.has_key?(:account_type)
      @user.private_tables_enabled  = attributes[:private_tables_enabled]   if attributes.has_key?(:private_tables_enabled)
      @user.map_view_quota          = attributes[:map_view_quota]           if attributes.has_key?(:map_view_quota)
      @user.map_view_block_price    = attributes[:map_view_block_price]           if attributes.has_key?(:map_view_block_price)
      @user.period_end_date         = attributes[:period_end_date]          if attributes.has_key?(:period_end_date)
      @user.max_layers              = attributes[:max_layers]               if attributes.has_key?(:max_layers)
      @user.user_timeout            = attributes[:user_timeout]             if attributes.has_key?(:user_timeout)
      @user.database_timeout        = attributes[:database_timeout]         if attributes.has_key?(:database_timeout)
      @user.upgraded_at             = attributes[:upgraded_at]              if attributes.has_key?(:upgraded_at)

      if attributes[:password].present?
        @user.password              = attributes[:password]
        @user.password_confirmation = attributes[:password]
      else
        @user.crypted_password      = attributes[:crypted_password]
        @user.salt                  = attributes[:salt]
      end
    end

    @user.save
    respond_with(:superadmin, @user)
  end

  def update
    if attributes = params[:user]
      @user.username                = attributes[:username]                 if attributes.has_key?(:username)
      @user.email                   = attributes[:email]                    if attributes.has_key?(:email)
      @user.quota_in_bytes          = attributes[:quota_in_bytes]           if attributes.has_key?(:quota_in_bytes)
      @user.admin                   = attributes[:admin]                    if attributes.has_key?(:admin)
      @user.enabled                 = attributes[:enabled]                  if attributes.has_key?(:enabled)
      @user.map_enabled             = attributes[:map_enabled]              if attributes.has_key?(:map_enabled)
      @user.quota_in_bytes          = attributes[:quota_in_bytes]           if attributes.has_key?(:quota_in_bytes)
      @user.table_quota             = attributes[:table_quota]              if attributes.has_key?(:table_quota)
      @user.account_type            = attributes[:account_type]             if attributes.has_key?(:account_type)
      @user.private_tables_enabled  = attributes[:private_tables_enabled]   if attributes.has_key?(:private_tables_enabled)
      @user.map_view_quota          = attributes[:map_view_quota]           if attributes.has_key?(:map_view_quota)
      @user.map_view_block_price    = attributes[:map_view_block_price]     if attributes.has_key?(:map_view_block_price)
      @user.period_end_date         = attributes[:period_end_date]          if attributes.has_key?(:period_end_date)
      @user.max_layers              = attributes[:max_layers]               if attributes.has_key?(:max_layers)
      @user.user_timeout            = attributes[:user_timeout]             if attributes.has_key?(:user_timeout)
      @user.database_timeout        = attributes[:database_timeout]         if attributes.has_key?(:database_timeout)
      @user.upgraded_at             = attributes[:upgraded_at]              if attributes.has_key?(:upgraded_at)

      if attributes[:password].present?
        @user.password = attributes[:password]
        @user.password_confirmation = attributes[:password]
      else
        @user.crypted_password      = attributes[:crypted_password] if attributes.has_key?(:crypted_password)
        @user.salt                  = attributes[:salt] if attributes.has_key?(:salt)
      end
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

class Superadmin::UsersController < Superadmin::SuperadminController
  ssl_required :index, :show, :new, :create, :edit, :update, :destroy

  before_filter :get_user, :only => [:show, :edit, :update, :destroy]

  def index
    @users = User.all
  end

  def show
  end

  def new
    @user = User.new
  end

  def create
    if params[:user]
      attributes = params[:user]
      @user = User.new
      @user.username              = attributes[:username]
      @user.email                 = attributes[:email]
      @user.password              = attributes[:password]
      @user.password_confirmation = attributes[:password]
      @user.admin                 = attributes[:admin]
      @user.enabled               = true
      if @user.save
        redirect_to superadmin_users_path, :flash => {:success => 'User created successfully'}
      else
        render new_superadmin_user_path
      end
    end
  end

  def edit
  end

  def update
    if params[:user]
      attributes = params[:user]
      @user.username = attributes[:username]
      @user.email    = attributes[:email]
      if attributes[:password].present?
        @user.password = attributes[:password]
        @user.password_confirmation = attributes[:password]
      end
      @user.admin    = attributes[:admin]
      @user.enable attributes[:enabled]
      if @user.save
        @user.setup_user
        UserMailer.invitation_sent(@user, request.protocol, request.host_with_port).deliver if @user.was_disabled? && @user.enabled?
        redirect_to superadmin_users_path, :flash => {:success => 'User updated successfully'}
      else
        render edit_superadmin_user_path(@user)
      end
    end
  end

  def destroy
    if @user.destroy
      redirect_to superadmin_users_path, :flash => {:success => 'User removed successfully'}
    else
      render superadmin_user_path(@user)
    end
  end

  def get_user
    @user = User[params[:id]] if params[:id]
  end
  private :get_user
end

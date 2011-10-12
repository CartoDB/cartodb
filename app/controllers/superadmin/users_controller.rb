class Superadmin::UsersController < Superadmin::SuperadminController
  respond_to :json

  ssl_required :create, :update, :destroy if Rails.env.production?
  before_filter :get_user, :only => [:update, :destroy]
  
  def create
    # BEWARE. don't get clever. This is all explicit because of mass assignment limitations
    @user = User.new

    if attributes = params[:user]
      @user.username                = attributes[:username]
      @user.email                   = attributes[:email]   
      @user.admin                   = attributes[:admin]   
      @user.enabled                 = true
      @user.quota_in_bytes          = attributes[:quota_in_bytes] if attributes[:quota_in_bytes].present?
      
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
      @user.username        = attributes[:username] if attributes.has_key?(:username)
      @user.email           = attributes[:email] if attributes.has_key?(:email)
      @user.quota_in_bytes  = attributes[:quota_in_bytes] if attributes.has_key?(:quota_in_bytes)
      @user.admin           = attributes[:admin] if attributes.has_key?(:admin)
      @user.enabled         = attributes[:enabled] if attributes.has_key?(:enabled)
      @user.map_enabled     = attributes[:map_enabled] if attributes.has_key?(:map_enabled)

      if attributes[:password].present?
        @user.password = attributes[:password] 
        @user.password_confirmation = attributes[:password]
      else
        @user.crypted_password      = attributes[:crypted_password] if attributes.has_key?(:crypted_password)
        @user.salt                  = attributes[:salt] if attributes.has_key?(:salt)
      end
    end

    @user.save
    respond_with(:superadmin, @user)
  end

  def destroy
    @user.destroy
    respond_with(:superadmin, @user)
  end


  private

  def get_user
    @user = User[params[:id]] if params[:id]
  end
end

require_dependency 'google_plus_api'
require_dependency 'google_plus_config'

class UsersController < ApplicationController
  layout 'frontend'

  ssl_required :signup

  before_filter :load_organization
  before_filter :initialize_google_plus_config

  def signup
    @user = ::User.new
  end

  def create
    @user = ::User.new

    if params[:google_access_token].present? && @google_plus_config.present?
      user_data = GooglePlusAPI.new.get_user_data(params[:google_access_token])
    end

    if user_data
      user_data.set_values(@user)
    else
      @user.username = params[:user][:username]
      @user.email = params[:user][:email]
      @user.password = params[:user][:password]
      @user.password_confirmation = params[:user][:password]
    end
    @user.organization = @organization

    if @user.valid?
      @user_creation = Carto::UserCreation.new_user_signup(@user)
      @user_creation.save
      ::Resque.enqueue(::Resque::UserJobs::Signup::NewUser, @user_creation.id)
      flash.now[:success] = 'User creation in progress'
      render action: 'signup_confirmation'
    else
      flash.now[:error] = 'User not valid'
      render action: 'signup'
    end
  rescue => e
    CartoDB.notify_exception(e, { new_user: @user.inspect })
    flash.now[:error] = e.message
    render action: 'signup'
  end

  private

  def initialize_google_plus_config
    @google_plus_config = ::GooglePlusConfig.instance(CartoDB, Cartodb.config, '/signup')
  end

  def load_organization
    subdomain = CartoDB.extract_subdomain(request)
    @organization = ::Organization.where(name: subdomain).first if subdomain
    render_404 and return false unless @organization
  end

end

class UsersController < ApplicationController
  layout 'frontend'

  ssl_required :signup

  before_filter :load_organization

  def signup
    @user = ::User.new
  end

  def create
    @user = ::User.new
    @user.username = params[:user][:username]
    @user.email = params[:user][:email]
    @user.password = params[:user][:password]
    @user.password_confirmation = params[:user][:password]
    @user.organization = @organization
    if @user.valid?
      ::Resque.enqueue(::Resque::UserJobs::Signup::NewUser, @user.username, @user.email, @user.password, @user.organization_id)
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

  def load_organization
    subdomain = CartoDB.extract_subdomain(request)
    @organization = ::Organization.where(name: subdomain).first if subdomain
    render_404 and return false unless @organization
  end

end

class PasswordResetsController < ApplicationController

  layout "frontend"

  before_action :load_organization_from_request, only: [:new, :create, :sent, :changed]
  before_action :load_user_and_organization, only: [:edit, :update]
  after_action :set_referrer_policy

  def new; end

  def create
    email = params[:email]

    if email.blank?
      @error = "Email cannot be blank"
      render :new
      return
    end

    @user = Carto::User.find_by_email(email)
    @user.try(:send_password_reset!)

    respond_to do |format|
      format.html { redirect_to CartoDB.path(self, "sent_password_reset") }
      format.js   { head :ok }
    end
  end

  def edit; end

  def update
    # check if it's valid token
    if @user.password_reset_sent_at < 48.hours.ago
      redirect_to(new_password_reset_path, alert: "Password reset has expired")
      return
    end

    # form validation. Has to be done this way as it's non-standard
    pw  = params[:carto_user][:password]
    pwc = params[:carto_user][:password_confirmation]

    if (pw.blank? || pwc.blank?) || (pw != pwc)
      @user.errors.add(:password, "Please ensure your passwords match")
      @user.errors.add(:password_confirmation, "Please ensure your passwords match")
      render :edit
      return
    end

    @user.valid_password?(:password, pw, pwc)
    return render :edit unless @user.errors.empty?

    @user.password = pw
    @user.password_confirmation = pwc
    if @user.save
      @user.update_attribute(:password_reset_token, nil)
      redirect_to build_url('changed')
    else
      render :edit
    end
  end

  def sent; end

  def changed; end

  private

  def load_organization_from_request
    @organization = Carto::Organization.where(name: CartoDB.extract_subdomain(request)).first
  end

  def load_user_and_organization
    @user = Carto::User.find_by_password_reset_token!(params[:id])
    @organization = @user.organization
  end

  def build_url(view_name)
    organization_name = @user.organization.try(:name)
    base_url = CartoDB.base_url(organization_name)
    path = CartoDB.path(self, "#{view_name}_password_reset")
    "#{base_url}#{path}"
  end

  def set_referrer_policy
    headers['Referrer-Policy'] = 'origin'
  end
end

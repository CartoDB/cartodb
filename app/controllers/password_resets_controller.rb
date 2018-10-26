# encoding: utf-8

class PasswordResetsController < ApplicationController

  layout "frontend"

  before_action :load_organization_from_request
  before_action :load_user_from_token, only: [:edit, :update]

  def new; end

  def create
    email = params[:email]

    if email.blank?
      @error = "Email cannot be blank"
      render :new
      return
    end

    user = Carto::User.find_by_email(email)

    if !user
      @error = "Cannot find email"
      render :new
      return
    end

    user.send_password_reset!

    respond_to do |format|
      format.html { redirect_to sent_password_resets_path }
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

    @user.password = pw
    @user.password_confirmation = pwc
    if @user.save
      @user.update_attribute(:password_reset_token, nil)
      redirect_to changed_password_resets_path
    else
      render :edit
    end
  end

  def sent; end

  private

  def load_user_from_token
    @user = Carto::User.find_by_password_reset_token!(params[:id])
  end

  def load_organization_from_request
    @organization = Carto::Organization.where(name: CartoDB.extract_subdomain(request)).first
  end

end

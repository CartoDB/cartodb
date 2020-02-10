require_relative '../../lib/cartodb/stats/authentication'

class PasswordChangeController < ApplicationController

  layout 'frontend'

  ssl_required :edit, :update

  PASSWORD_MATCH_MSG = 'Please ensure your passwords match'.freeze
  WRONG_PASSWORD_MSG = 'Please ensure you typed the password correctly'.freeze
  DIFFERENT_PASSWORD_MSG = 'Must be different than current password'.freeze
  FORM_ERROR = 'Could not update the password. Please, try again'.freeze

  before_filter :set_user
  before_filter :set_errors
  before_filter :check_password_expired

  def edit; end

  def update
    opw = params[:old_password]
    pw  = params[:password]
    pwc = params[:password_confirmation]

    if !@user.validate_old_password(opw)
      @old_password_error = WRONG_PASSWORD_MSG
      render :edit
      return
    elsif pw.blank? || pwc.blank? || pw != pwc
      @new_password_error = PASSWORD_MATCH_MSG
      render :edit
      return
    elsif pw == opw
      @new_password_error = DIFFERENT_PASSWORD_MSG
      render :edit
      return
    end

    @user.change_password(opw, pw, pwc)

    unless @user.errors.empty?
      @old_password_error = @user.errors[:old_password]
      @new_password_error = @user.errors[:new_password]
      render :edit
      return
    end

    if @user.update_in_central && @user.save
      warden.set_user(@user, scope: @user.username)
      CartoDB::Stats::Authentication.instance.increment_login_counter(@user.email)

      redirect_to session.delete('return_to') ||
                  (@user.public_url + CartoDB.path(self, 'dashboard', trailing_slash: true))
    else
      @password_error = FORM_ERROR
      render :edit
    end
  end

  private

  def days_since_last_password_change
    (Time.now.to_date - @user.password_date.to_date).to_i
  end

  def set_user
    username = params[:id].strip.downcase
    @user = User.where("email = ? OR username = ?", username, username).first
    @organization = @user.organization
  end

  def set_errors
    @password_error = "Out with the old, in with the new! Your password is more than #{days_since_last_password_change} days old; please create a brand new one to log in."
  end

  def check_password_expired
    render_403 unless @user.password_expired?
  end
end

# encoding: utf-8

require_relative '../../lib/cartodb/stats/authentication'

class PasswordChangeController < SessionsController

  layout 'frontend'

  ssl_required :edit, :update

  PASSWORD_MATCH_MSG = 'Please ensure your passwords match'.freeze
  WRONG_PASSWORD_MSG = 'Please ensure you typed the password correctly'.freeze

  before_filter :set_user
  before_filter :set_errors

  def edit; end

  def update
    opw = params[:old_password]
    pw  = params[:password]
    pwc = params[:password_confirmation]

    if pw.blank? || pwc.blank? || pw != pwc
      @new_password_error = PASSWORD_MATCH_MSG
      render :edit
      return
    end

    unless @user.validate_old_password(opw)
      @old_password_error = WRONG_PASSWORD_MSG
      render :edit
      return
    end

    @user.change_password(opw, pw, pwc)
    if @user.save
      params[:email] = @user.username
      create
    else
      @password_error = "Could not update the password. Please, try again."
      render :edit
    end
  end

  private

  def set_user
    username = params[:id].strip.downcase
    @user = User.where("email = ? OR username = ?", username, username).first
  end

  def set_errors
    @password_error = "Out with the old, in with the new! Your password is more than #{@user.days_since_last_password_change} days old; please create a brand new one to log in."
  end
end

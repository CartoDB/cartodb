# encoding: utf-8

require_relative '../../lib/cartodb/stats/authentication'

class PasswordChangeController < SessionsController

  layout 'frontend'

  ssl_required :edit, :update

  PASSWORD_ERROR_MSG = 'Your password has expired. Please, change your password to continue using CARTO.'.freeze
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
      @user.errors.add(:password, PASSWORD_MATCH_MSG)
      @user.errors.add(:password_confirmation, PASSWORD_MATCH_MSG)
      render :edit
      return
    end

    unless @user.validate_old_password(opw)
      @user.errors.add(:old_password, WRONG_PASSWORD_MSG)
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
    @password_error = PASSWORD_ERROR_MSG
  end
end
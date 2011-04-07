# coding: UTF-8

class Admin::UsersController < ApplicationController
  ssl_required :edit, :update, :unlock, :destroy

  before_filter :login_required

  def edit

  end

  def update
    redirect_to edit_user_path(current_user) and return unless params && params[:user].present?

    current_user.email                 = params[:user].delete(:email)
    current_user.password              = params[:user].delete(:password)
    current_user.password_confirmation = params[:user].delete(:password_confirmation)
    if current_user.save
      redirect_to edit_user_path(current_user), :flash => {:success => 'Your data was updated successfully.'}
    else
      flash.now[:error] = 'There was an error when updating your user data.'
      render :action => :edit
    end

  end

  def destroy
    if current_user.destroy
      redirect_to logout_path and return
    end
    redirect_to root_path, :flash => {:error => "There's been an error deleting your account. Please, try it again a bit later."}
  end

  def unlock
    status = 500
    if params[:unlock_password]
      status = 200 if (user = User.authenticate(current_user.email, params[:unlock_password])) && user.enabled?
    end
    head status
  end

end
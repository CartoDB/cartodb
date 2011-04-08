# coding: UTF-8

class Admin::UsersController < ApplicationController
  ssl_required :edit, :update, :unlock, :destroy

  before_filter :login_required, :except => :byebye
  before_filter :valid_unlock_token?, :except => [:edit, :unlock, :byebye]

  def edit
    session[:unlock_token] = nil
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
      redirect_to farewel_path and return
    end
    redirect_to root_path, :flash => {:error => "There's been an error deleting your account. Please, try it again a bit later."}
  end

  def byebye
    render :layout => 'front_layout'
  end

  def unlock
    status = 500
    if params[:unlock_password]
      if (user = User.authenticate(current_user.email, params[:unlock_password])) && user.enabled?
        status = 200
        session[:unlock_token] = User.make_token
      end
    end
    head status
  end

  def valid_unlock_token?
    return unless session[:unlock_token] == nil
    env['warden'].set_user(nil)
    redirect_to root_path
  end
  private :valid_unlock_token?

end
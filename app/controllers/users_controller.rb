class UsersController < ApplicationController

  def create
    @user = User.new :email => params[:email]
    if @user.save
      redirect_to thanks_path and return
    else
      render :template => 'home/index'
    end
  end

end

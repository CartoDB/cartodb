class UsersController < ApplicationController

  layout 'front_layout'

  def create
    @user = User.new_from_email params[:email]
    if @user.save
      UserMailer.ask_for_invitation(@user).deliver
      redirect_to thanks_path and return
    else
      render :template => 'home/index'
    end
  end

end

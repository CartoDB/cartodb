class InvitationsController < ApplicationController
  ssl_required :edit, :update

  layout 'front_layout'

  before_filter :invite_token_valid?, :only => [:edit, :update]

  def create
    @user = User.new_from_email params[:email]
    if @user.save
      UserMailer.ask_for_invitation(@user).deliver
      redirect_to thanks_path and return
    else
      render :template => 'home/index'
    end
  end

  def edit
    @user = User[:id => params[:id]]
  end

  def update
    render :action => :edit and return unless params[:user]

    @user = User[:id => params[:id]]
    @user.password = params[:user][:password]
    @user.password_confirmation = params[:user][:password_confirmation]

    if @user.activate
      env['warden'].set_user(@user)
      redirect_to dashboard_path
    else
      render :action => :edit
    end
  end

  def invite_token_valid?
    redirect_to root_path and return false if params.blank? || (params[:invite_token].blank? && params[:user].blank?)

    invite_token = params[:invite_token] || params[:user][:invite_token]
    redirect_to root_path and return false if params[:id].blank? || invite_token.blank?

    @user = User.filter({:id => params[:id]} & {:invite_token => invite_token}).first
    redirect_to root_path and return false if @user.nil? || @user.invite_token_date < 30.days.ago.to_date
  end
  private :invite_token_valid?

end
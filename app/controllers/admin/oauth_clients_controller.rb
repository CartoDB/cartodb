# coding: UTF-8

class OauthClientsController < ApplicationController

  before_filter :login_required

  def index
    @client_application = current_user.client_application || ClientApplication.new :user_id => current_user.id
  end

  def create
    @client_application = current_user.client_application.build(params[:client_application])
    if @client_application.save
      flash[:notice] = "Registered the information successfully"
      redirect_to :action => "show", :id => @client_application.id
    else
      render :action => "new"
    end
  end

  def update
    if @client_application.update_attributes(params[:client_application])
      flash[:notice] = "Updated the client information successfully"
      redirect_to :action => "show", :id => @client_application.id
    else
      render :action => "edit"
    end
  end

  def destroy
    @client_application.destroy
    flash[:notice] = "Destroyed the client application registration"
    redirect_to :action => "index"
  end

end

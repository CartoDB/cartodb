# coding: UTF-8

class Admin::OauthClientsController < ApplicationController

  before_filter :login_required

  def show
    @client_application = current_user.client_application || ClientApplication.create(:user_id => current_user.id)
  end

end

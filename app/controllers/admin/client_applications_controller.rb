# coding: UTF-8

class Admin::ClientApplicationsController < ApplicationController

  before_filter :login_required

  def oauth
    @client_application = current_user.client_application
  end

  def jsonp
  end

end

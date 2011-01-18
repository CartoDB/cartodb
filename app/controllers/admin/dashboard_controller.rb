class Admin::DashboardController < ApplicationController

  before_filter :login_required

  def index
    @tables = current_user.tables.select(:id,:name,:privacy).all
  end

end